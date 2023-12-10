import { describe, expect, test, beforeEach } from 'vitest'
import got from 'got'
import skp from 'set-cookie-parser'
import { stringify } from 'querystring'
import { generators } from 'openid-client'
import { build } from '../helper.js'

import prisma from '../../../db/__mocks__/client.js'

describe('interaction router', () => {
  let fastify
  let port
  beforeEach(async () => {
    // called once before each test run
    fastify = await build()
    await fastify.ready()
    await fastify.listen()
    port = fastify.server.address().port

    // clean up function, called once after each test run
    return async () => {
      await fastify.close()
    }
  })
  test('interaction/:uid GET -> renders login', async (ctx) => {
    const clientMock = {
      payload: {
        client_id: 'goodclient',
        redirect_uris: ['https://somerp.com/cb'],
        token_endpoint_auth_method: 'none'
      }
    }
    prisma.oidcModel.findUnique.mockResolvedValueOnce(clientMock)

    const baseUrl = `http://localhost:${port}`
    const goodchallenge = { code_challenge: generators.codeChallenge('abc'), code_challenge_method: 'S256' }
    const q = stringify({ client_id: 'goodclient', redirect_uri: 'https://somerp.com/cb', response_type: 'code', ...goodchallenge })
    const url = `${baseUrl}/oidc/auth/?${q}`
    const { statusCode, headers } = await got(url, { followRedirect: false })

    expect(statusCode).toEqual(303)
    expect(headers.location).toMatch('/interaction')

    const parsed = skp(headers['set-cookie'])
    const { value: interactionJTI } = parsed.filter(c => c.name === '_interaction')[0]
    const epoch = (date = Date.now()) => Math.floor(date / 1000)

    prisma.oidcModel.findUnique.mockResolvedValueOnce({
      payload: {
        // interaction mock
        cid: 'gORORb3lcg6C9ksV8a0Ve',
        exp: epoch() + 3600,
        iat: epoch(),
        jti: interactionJTI,
        kind: 'Interaction',
        params: {
          client_id: 'goodclient',
          redirect_uri: 'https://somerp.com/cb',
          response_type: 'code',
          code_challenge: goodchallenge.code_challenge,
          code_challenge_method: 'S256'
        },
        prompt: {
          name: 'login',
          details: {},
          reasons: ['no_session']
        },
        returnTo: `http://localhost:9876/auth/${interactionJTI}`
      }
    }).mockResolvedValueOnce(clientMock) // this is important.
    // First oidc-provider will call interaction find, then we call in route client find

    const interactionResponse = await got(`${baseUrl}${headers.location}`, {
      headers: {
        Cookie: headers['set-cookie'].join(';')
      }
    })
    const containsTitle = interactionResponse.body.includes('<title>Sign-in</title>')
    expect(containsTitle).toBe(true)
  })

  test('interaction/:uid GET -> renders consent', async (ctx) => {
    const clientMock = {
      payload: {
        client_id: 'goodclient',
        redirect_uris: ['https://somerp.com/cb'],
        token_endpoint_auth_method: 'none'
      }
    }
    prisma.oidcModel.findUnique.mockResolvedValueOnce(clientMock)

    const baseUrl = `http://localhost:${port}`
    const goodchallenge = { code_challenge: generators.codeChallenge('abc'), code_challenge_method: 'S256' }
    const q = stringify({ client_id: 'goodclient', redirect_uri: 'https://somerp.com/cb', response_type: 'code', ...goodchallenge })
    const url = `${baseUrl}/oidc/auth/?${q}`
    const { statusCode, headers } = await got(url, { followRedirect: false })

    expect(statusCode).toEqual(303)
    expect(headers.location).toMatch('/interaction')

    const parsed = skp(headers['set-cookie'])
    const { value: interactionJTI } = parsed.filter(c => c.name === '_interaction')[0]
    const epoch = (date = Date.now()) => Math.floor(date / 1000)

    prisma.oidcModel.findUnique.mockResolvedValueOnce({
      payload: {
        // interaction mock
        cid: 'gORORb3lcg6C9ksV8a0Ve',
        exp: epoch() + 3600,
        iat: epoch(),
        jti: interactionJTI,
        kind: 'Interaction',
        params: {
          client_id: 'goodclient',
          redirect_uri: 'https://somerp.com/cb',
          response_type: 'code',
          code_challenge: goodchallenge.code_challenge,
          code_challenge_method: 'S256'
        },
        prompt: {
          name: 'consent',
          details: {},
          reasons: ['op_scopes_missing']
        },
        returnTo: `http://localhost:9876/auth/${interactionJTI}`
      }
    }).mockResolvedValueOnce(clientMock) // this is important.
    // First oidc-provider will call interaction find, then we call in route client find

    const interactionResponse = await got(`${baseUrl}${headers.location}`, {
      headers: {
        Cookie: headers['set-cookie'].join(';')
      }
    })
    const containsTitleAuthorize = interactionResponse.body.includes('<title>Authorize</title>')
    expect(containsTitleAuthorize).toBe(true)
  })
})
