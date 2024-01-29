import assert from 'node:assert/strict'
import FormBody from '@fastify/formbody'
import Fastify from 'fastify'
import NoCache from 'fastify-disablecache'
import { errors } from 'oidc-provider'

import CSP from '../../csp.js'

import debug from './debug-render.js'

const { errorCodes } = Fastify
const { FST_ERR_BAD_STATUS_CODE } = errorCodes
const { SessionNotFound } = errors

const MERGE = {
  mergeWithLastSubmission: true
}
const NO_MERGE = {
  mergeWithLastSubmission: false
}

export default async function interactionsRouter(fastify, opts) {
  const Account = opts.Account
  const Connection = opts.Connection
  const AccountErrors = opts.AccountErrors
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

  fastify.get('/:uid', getInteraction)
  fastify.post('/:uid/login', checkLogin)
  fastify.post('/:uid/confirm', interactionConfirm)
  fastify.get('/:uid/abort', interactionAbort)

  async function getInteraction(request, reply) {
    const provider = this.oidc
    const {
      uid,
      prompt,
      params,
      session,
      lastSubmission = {}
    } = await provider.interactionDetails(request, reply)

    const client = await provider.Client.find(params.client_id)
    const connections = await Connection.getEnabledConnections(client.clientId)

    const connectionTypes = new Set(connections.map((x) => x.type))

    if (connectionTypes.size === 0 && client.clientId !== 'tester') {
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
        return reply.view('login.ejs', {
          nonce,
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Sign-in',
          connectionTypes,
          session: session ? debug(session) : undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          },
          error: lastSubmission.user_error_desc
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
      prompt: { name }
    } = await provider.interactionDetails(request, reply)
    assert.equal(name, 'login')
    let account
    try {
      account = await Account.authenticate(
        request.body.login,
        request.body.password
      )
    } catch (error) {
      this.log.error(error)

      if (!(error instanceof AccountErrors.AccountNotFound)) {
        throw error
      }
      const iErr = {
        user_error: 'access_denied',
        user_error_desc: 'Invalid email or password'
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
}
