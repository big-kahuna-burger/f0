import assert from 'node:assert/strict'
import * as querystring from 'node:querystring'
import { inspect } from 'node:util'
import FormBody from '@fastify/formbody'
import Fastify from 'fastify'
import NoCache from 'fastify-disablecache'
import isEmpty from 'lodash/isEmpty.js'
import { errors } from 'oidc-provider'
import Account from '../../oidc/support/account.js'
import { errors as accountErrors } from '../../oidc/support/account.js'
const { errorCodes } = Fastify
const { FST_ERR_BAD_STATUS_CODE } = errorCodes
const { SessionNotFound } = errors
const keys = new Set()
const debug = (obj) =>
  querystring.stringify(
    Object.entries(obj).reduce((acc, [key, value]) => {
      keys.add(key)
      if (isEmpty(value)) return acc
      acc[key] = inspect(value, { depth: null })
      return acc
    }, {}),
    '<br/>',
    ': ',
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value
      }
    }
  )
function errorHandler(error, request, reply) {
  if (error instanceof FST_ERR_BAD_STATUS_CODE) {
    this.log.error(error)
    reply.status(500).send({ ok: false })
  } else if (error instanceof SessionNotFound) {
    return reply.code(400).send('Session not found')
  } else if (error instanceof accountErrors.AccountNotFound) {
    return reply.code(401).send(error.message)
  }

  reply.send(error)
}
export default async function interactionsRouter(fastify, opts) {
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

    switch (prompt.name) {
      case 'login': {
        return reply.view('login.ejs', {
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Sign-in',
          session: session ? debug(session) : undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          },
          nonce: reply.cspNonce.script,
          error: lastSubmission.user_error_desc
        })
      }
      case 'consent': {
        return reply.view('interaction.ejs', {
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Authorize',
          session: session ? debug(session) : undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          },
          nonce: reply.cspNonce.script
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
      if (error instanceof accountErrors.AccountNotFound) {
        const errResult = {
          user_error: 'access_denied',
          user_error_desc: error.message
        }
        const returnTo = await provider.interactionResult(
          request,
          reply,
          errResult,
          {
            mergeWithLastSubmission: true
          }
        )
        return reply.redirect(303, returnTo)
      }
      throw error
    }
    console.log(account)
    // // const { login, password } = request.body
    // // TODO check password and stuff (login, password)

    const result = {
      login: {
        accountId: account.accountId
      }
    }

    const returnTo = await provider.interactionResult(request, reply, result, {
      mergeWithLastSubmission: false
    })
    console.log('sending them to ', returnTo, reply.raw.headers)
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
    const returnTo = await provider.interactionResult(request, reply, result, {
      mergeWithLastSubmission: false
    })
    reply.header('Content-Length', 0)
    return reply.redirect(303, returnTo)
  }

  async function interactionAbort(request, reply) {
    const provider = this.oidc
    const result = {
      error: 'access_denied',
      error_description: 'End-User aborted interaction'
    }
    const returnTo = await provider.interactionResult(request, reply, result, {
      mergeWithLastSubmission: false
    })
    reply.header('Content-Length', 0)
    return reply.redirect(303, returnTo)
  }
}
