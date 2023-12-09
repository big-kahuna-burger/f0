import assert from 'node:assert/strict'
import * as querystring from 'node:querystring'
import { inspect } from 'node:util'
import NoCache from 'fastify-disablecache'
import FormBody from '@fastify/formbody'
import isEmpty from 'lodash/isEmpty.js'
import Account from '../../oidc/support/account.js'

const keys = new Set()
const debug = (obj) => querystring.stringify(Object.entries(obj).reduce((acc, [key, value]) => {
  keys.add(key)
  if (isEmpty(value)) return acc
  acc[key] = inspect(value, { depth: null })
  return acc
}, {}), '<br/>', ': ', {
  encodeURIComponent (value) { return keys.has(value) ? `<strong>${value}</strong>` : value }
})
const noop = function () {}

export default async function interactionsRouter (fastify, opts) {
  fastify.register(FormBody)
  fastify.register(NoCache)
  
  fastify.get('/:uid', getInteraction)
  fastify.post('/:uid/login', checkLogin)
  fastify.post('/:uid/confirm', interactionConfirm)
  fastify.get('/:uid/abort', interactionAbort)

  async function getInteraction (request, reply) {
    const provider = this.oidc
    const {
      uid, prompt, params, session
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
          }
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
          }
        })
      }
      default:
        return undefined
    }
  }

  async function checkLogin (request, reply) {
    const provider = this.oidc
    const { prompt: { name } } = await provider.interactionDetails(request, reply)
    assert.equal(name, 'login')

    const account = await Account.findByLogin(request.body.login)

    // const { login, password } = request.body
    // TODO check password and stuff (login, password)

    const result = {
      login: {
        accountId: account.accountId
      }
    }
    // just alias it so oidc-p can call .header
    reply.setHeader = reply.header
    reply.end = noop

    await provider.interactionFinished(request, reply, result, {
      mergeWithLastSubmission: false
    })

    return reply.send()
  }

  async function interactionConfirm (request, reply) {
    const provider = this.oidc
    const interactionDetails = await provider.interactionDetails(request, reply)
    const { prompt: { name, details }, params, session: { accountId } } = interactionDetails
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
      for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
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

    reply.setHeader = reply.header
    reply.end = noop

    await provider.interactionFinished(request, reply, result, { mergeWithLastSubmission: true })
    return reply.send()
  }

  async function interactionAbort (request, reply) {
    const result = {
      error: 'access_denied',
      error_description: 'End-User aborted interaction'
    }
    reply.setHeader = reply.header
    reply.end = noop
    await this.oidc.interactionFinished(request, reply, result, { mergeWithLastSubmission: false })
    return reply.send()
  }
}
