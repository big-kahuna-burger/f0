import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import FormBody from '@fastify/formbody'
import Fastify from 'fastify'
import NoCache from 'fastify-disablecache'
import { errors } from 'oidc-provider'
import CSP from '../../csp.js'
import debug from './debug-render.js'

const sha256 = (input) =>
  crypto.createHash('sha256').update(input).digest('hex')

const { errorCodes } = Fastify
const { FST_ERR_BAD_STATUS_CODE } = errorCodes
const { SessionNotFound } = errors

const MERGE = {
  mergeWithLastSubmission: true
}
const NO_MERGE = {
  mergeWithLastSubmission: false
}
const GH_COOKIE_KEY = 'github.nonce'
const GOOGLE_NONCE_COOKIE_KEY = 'google.nonce'

export default async function interactionsRouter(fastify, opts) {
  const Account = opts.Account
  const Connection = opts.Connection
  const AccountErrors = opts.AccountErrors
  const InteractonsAPI = opts.InteractonsAPI

  function errorHandler(error, request, reply) {
    if (error instanceof FST_ERR_BAD_STATUS_CODE) {
      this.log.error(error)
      reply.status(500).send({ ok: false })
    } else if (error instanceof SessionNotFound) {
      return reply.code(400).send('Session not found')
    } else if (error instanceof AccountErrors.AccountNotFound) {
      return reply.code(401).send(error.message)
    }

    reply.send(error)
  }
  fastify.setErrorHandler(errorHandler)
  fastify.register(FormBody)
  fastify.register(NoCache)

  fastify.get('/:uid', getInteraction) // render login prompt - login page
  fastify.get('/:uid/register', getInteraction) // render login prompt - register page
  fastify.post('/:uid/login', checkLogin) // submit login prompt with authentication
  fastify.post('/:uid/register', registerUser) // submit login prompt with registration
  fastify.post('/:uid/confirm', interactionConfirm) // submit consent prompt
  fastify.get('/:uid/abort', interactionAbort) // abort the interaction
  fastify.get('/callback/:upstream', callbackUpstream) // federation callback
  fastify.post('/:uid/federated', federated) // federated

  async function federated(request, reply) {
    const provider = this.oidc
    const { upstream } = request.body
    const {
      prompt: { name }
    } = await provider.interactionDetails(request, reply)
    const path = `/interaction/${request.params.uid}/federated`
    const cookieOpts = { path, sameSite: 'strict' }
    switch (upstream) {
      case 'google': {
        const oidcClients = await opts.getFederationClients()
        const googleClient = oidcClients['google-oauth2']
        const cbParams = googleClient.callbackParams(request)

        // init
        if (!Object.keys(cbParams).length) {
          const state = request.params.uid
          const nonce = crypto.randomBytes(32).toString('hex')

          return reply
            .cookie(GOOGLE_NONCE_COOKIE_KEY, nonce, cookieOpts)
            .redirect(
              303,
              googleClient.authorizationUrl({
                state,
                nonce,
                scope: 'openid email profile',
                prompt: 'select_account'
              })
            )
        }
        // callback
        const nonce = request.cookies[GOOGLE_NONCE_COOKIE_KEY]
        reply.cookie(GOOGLE_NONCE_COOKIE_KEY, null, cookieOpts)

        const tokenset = await googleClient.callback(undefined, cbParams, {
          state: request.params.uid,
          nonce,
          response_type: 'id_token'
        })

        const account = await Account.findByFederated(
          'google',
          tokenset.claims()
        )

        const result = { login: { accountId: account.accountId } }
        const returnTo = await provider.interactionResult(
          request,
          reply,
          result,
          NO_MERGE
        )
        return reply.redirect(303, returnTo)
      }
      case 'github': {
        const oidcClients = await opts.getFederationClients()
        const githubClient = oidcClients.github
        const cbParams = githubClient.callbackParams(request)

        // init
        if (!Object.keys(cbParams).length) {
          const state = request.params.uid
          const nonce = crypto.randomBytes(32).toString('hex')

          return reply.cookie(GH_COOKIE_KEY, nonce, cookieOpts).redirect(
            303,
            githubClient.authorizationUrl({
              state,
              nonce,
              scope: 'user:email'
            })
          )
        }
        // callback
        const nonce = request.cookies[GH_COOKIE_KEY]
        reply.cookie(GH_COOKIE_KEY, null, cookieOpts)

        const tokenset = await githubClient.oauthCallback(undefined, cbParams, {
          state: request.params.uid,
          nonce
        })

        const githubClaims = await githubClient.userinfo(tokenset)
        const emails = await githubClient.requestResource(
          'https://api.github.com/user/emails',
          tokenset
        )
        const githubEmails = JSON.parse(emails.body.toString())
        const primaryEmail = githubEmails.find((e) => e.primary)
        githubClaims.email = primaryEmail.email
        githubClaims.sub = sha256(githubClaims.email).substring(0, 21)
        const account = await Account.findByFederated('github', githubClaims)

        const result = { login: { accountId: account.accountId } }
        const returnTo = await provider.interactionResult(
          request,
          reply,
          result,
          NO_MERGE
        )
        return reply.redirect(303, returnTo)
      }
      default:
        return undefined
    }
  }
  async function getInteraction(request, reply) {
    const provider = this.oidc
    const {
      uid,
      prompt,
      params,
      session,
      lastSubmission = {}
    } = await provider.interactionDetails(request, reply)
    const isRegister =
      request.url.includes('register') ||
      lastSubmission.lastAction === 'register'

    const client = await provider.Client.find(params.client_id)
    const isTester = client.clientId === 'tester'
    const enabled = isTester
      ? await Connection.getAllConnections()
      : await Connection.getEnabledConnections(client.clientId)

    let connections = enabled

    if (params.connection) {
      const selected = enabled.find((c) => c.name === params.connection)
      if (!selected) {
        const returnTo = await provider.interactionResult(
          request,
          reply,
          {
            error: 'access_denied',
            error_description: 'Invalid connection'
          },
          NO_MERGE
        )
        reply.header('Content-Length', 0)
        return reply.redirect(303, returnTo)
      }
      // narrow down the list of connections to just the selected one
      connections = [selected]
    }

    const connectionsSupportingRegister =
      connections.length &&
      connections.filter((c) => c.disableSignup).length === 0

    if (isRegister && !connectionsSupportingRegister) {
      const result = {
        error: 'access_denied',
        error_description: 'No connections support registration'
      }
      const returnTo = await provider.interactionResult(
        request,
        reply,
        result,
        NO_MERGE
      )
      reply.header('Content-Length', 0)
      return reply.redirect(303, returnTo)
    }

    const connectionStrategies = new Set(connections.map((x) => x.strategy))

    if (connectionStrategies.size === 0 && client.clientId !== 'tester') {
      const result = {
        error: 'access_denied',
        error_description: 'No connections available for this client'
      }
      const returnTo = await provider.interactionResult(
        request,
        reply,
        result,
        NO_MERGE
      )
      reply.header('Content-Length', 0)
      return reply.redirect(303, returnTo)
    }

    if (prompt.name === 'consent' && client.logoUri) {
      const CSPAdjusted = { ...CSP }
      CSPAdjusted.directives.imgSrc = [
        ...CSP.directives.imgSrc,
        new URL(client.logoUri).origin
      ]

      await reply.helmet({
        contentSecurityPolicy: CSPAdjusted
      })
    }
    const nonce = reply.raw.scriptNonce
    switch (prompt.name) {
      case 'login': {
        const viewName = isRegister ? 'register.ejs' : 'login.ejs'
        const title = isRegister ? 'Register' : 'Sign In'
        const error = lastSubmission.user_error_desc
        // resetError
        if (error) {
          await InteractonsAPI.clearInteractionError(request.params.uid)
        }
        const oidcClients = await opts.getFederationClients()
        return reply.view(viewName, {
          nonce,
          client,
          uid,
          details: prompt.details,
          params,
          title,
          locals: {
            google:
              oidcClients['google-oauth2'] &&
              connectionStrategies.has('GOOGLE'),
            github: oidcClients.github && connectionStrategies.has('GITHUB'),
            db: connectionStrategies.has('DB')
          },
          supportsRegister: connectionsSupportingRegister,
          session: session ? debug(session) : undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          },
          error
        })
      }
      case 'consent': {
        return reply.view('interaction.ejs', {
          nonce,
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Authorize',
          session: session ? debug(session) : undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          }
        })
      }
      default:
        return undefined
    }
  }

  async function checkLogin(request, reply) {
    const provider = this.oidc
    const {
      prompt: { name },
      params
    } = await provider.interactionDetails(request, reply)
    assert.equal(name, 'login')
    const client = await provider.Client.find(params.client_id)
    const isTester = client.clientId === 'tester'

    const connections = isTester
      ? await Connection.getAllConnections()
      : await Connection.getEnabledConnections(client.clientId)
    const dbConnections = connections.filter((c) => c.type === 'DB')
    const targetConnections = params.connection
      ? [dbConnections.find((c) => c.name === params.connection)]
      : dbConnections

    const targetConnectionIds = targetConnections.map((c) => c.id)
    let account
    try {
      account = await Account.authenticate(
        request.body.login,
        request.body.password,
        targetConnectionIds
      )
    } catch (error) {
      this.log.error(error)

      if (!(error instanceof AccountErrors.AccountNotFound)) {
        throw error
      }
      const iErr = {
        user_error: 'access_denied',
        user_error_desc: 'Invalid email or password',
        lastAction: 'login'
      }
      const returnTo = await provider.interactionResult(
        request,
        reply,
        iErr,
        NO_MERGE
      )
      return reply.redirect(303, returnTo)
    }

    const result = { login: { accountId: account.accountId } }

    const returnTo = await provider.interactionResult(
      request,
      reply,
      result,
      NO_MERGE
    )
    return reply.redirect(303, returnTo)
  }

  async function registerUser(request, reply) {
    const provider = this.oidc
    const {
      prompt: { name },
      params
    } = await provider.interactionDetails(request, reply)

    assert.equal(name, 'login')
    const client = await provider.Client.find(params.client_id)
    const connections = await Connection.getEnabledConnections(client.clientId)
    const dbConnections = connections.filter((c) => c.type === 'DB')
    // check that at least one connection supports registration
    if (dbConnections.length === 0) {
      const returnTo = await provider.interactionResult(
        request,
        reply,
        {
          user_error: 'access_denied',
          user_error_desc: 'No connections support registration'
        },
        MERGE
      )
      return reply.redirect(303, returnTo)
    }

    const targetConnection = params.connection
      ? dbConnections.find((c) => c.name === params.connection) // HRD (home realm discovery) done on client side somehow
      : dbConnections[0] // no HRD, so register to first connection

    let account
    try {
      account = await Account.register(
        request.body.login,
        request.body.password,
        targetConnection.id
      )
    } catch (error) {
      this.log.error(error)

      if (!(error instanceof AccountErrors.AccountExists)) {
        throw error
      }
      const iErr = {
        user_error: 'access_denied',
        user_error_desc: 'Account already exists',
        lastAction: 'register'
      }
      const returnTo = await provider.interactionResult(
        request,
        reply,
        iErr,
        MERGE
      )
      return reply.redirect(303, returnTo)
    }

    const result = { login: { accountId: account.accountId } }

    const returnTo = await provider.interactionResult(
      request,
      reply,
      result,
      NO_MERGE
    )
    return reply.redirect(303, returnTo)
  }

  async function interactionConfirm(request, reply) {
    const provider = this.oidc
    const interactionDetails = await provider.interactionDetails(request, reply)
    const {
      prompt: { name, details },
      params,
      session: { accountId }
    } = interactionDetails
    assert.equal(name, 'consent')

    let { grantId } = interactionDetails
    let grant

    if (grantId) {
      // we'll be modifying existing grant in existing session
      grant = await provider.Grant.find(grantId)
    } else {
      // we're establishing a new grant
      grant = new provider.Grant({
        accountId,
        clientId: params.client_id
      })
    }

    if (details.missingOIDCScope) {
      grant.addOIDCScope(details.missingOIDCScope.join(' '))
    }
    if (details.missingOIDCClaims) {
      grant.addOIDCClaims(details.missingOIDCClaims)
    }
    if (details.missingResourceScopes) {
      for (const [indicator, scopes] of Object.entries(
        details.missingResourceScopes
      )) {
        grant.addResourceScope(indicator, scopes.join(' '))
      }
    }

    grantId = await grant.save()

    const consent = {}
    if (!interactionDetails.grantId) {
      // we don't have to pass grantId to consent, we're just modifying existing one
      consent.grantId = grantId
    }

    const result = { consent }
    const returnTo = await provider.interactionResult(
      request,
      reply,
      result,
      MERGE
    )
    reply.header('Content-Length', 0)
    return reply.redirect(303, returnTo)
  }

  async function interactionAbort(request, reply) {
    const provider = this.oidc
    const result = {
      error: 'access_denied',
      error_description: 'End-User aborted interaction'
    }
    const returnTo = await provider.interactionResult(
      request,
      reply,
      result,
      NO_MERGE
    )
    reply.header('Content-Length', 0)
    return reply.redirect(303, returnTo)
  }

  async function callbackUpstream(request, reply) {
    const nonce = reply.raw.scriptNonce
    const { upstream } = request.params
    return reply.viewNoLayout(
      upstream === 'google' ? 'repost-hash.ejs' : 'repost-query.ejs',
      {
        upstream,
        nonce
      }
    )
  }
}
