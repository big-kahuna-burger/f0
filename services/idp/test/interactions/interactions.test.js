import { describe, expect, test, beforeEach } from 'vitest'
import got from 'got'
import skp from 'set-cookie-parser'
import { stringify } from 'querystring'
import { generators } from 'openid-client'
import { build } from '../helper.js'

import prisma from '../../../db/__mocks__/client.js'
process.env.OTEL = true

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

  test('interaction/:uid/login POST -> get Authorize Interaction', async (ctx) => {
    const clientMock = {
      id: 'goodclient',
      payload: {
        client_id: 'goodclient',
        grant_types: ['authorization_code'],
        subject_type: 'public',
        redirect_uris: ['https://somerp.com/cb'],
        response_types: ['code'],
        post_logout_redirect_uris: [],
        token_endpoint_auth_method: 'none',
        id_token_signed_response_alg: 'RS256'
      }
    }
    const sessionDB = {}
    prisma.oidcModel.findUnique.mockImplementation((arg) => {
      if (arg.where.id_type.type === 7) {
        return clientMock
      }
      if (arg.where.id_type.type === 10) {
        return interactionsDB[arg.where.id_type.id]
      }
      if (arg.where.id_type.type === 1) {
        return sessionDB[arg.where.id_type.id]
      }
      console.log('findUnique', arg.where.id_type.type)
    })
    prisma.oidcModel.delete.mockImplementation((arg) => {
      if (arg.where.id_type.type === 10) {
        delete interactionsDB[arg.where.id_type.id]
        console.log('deleted interaction', arg.where.id_type.id)
        return
      }
      console.log('not deleted!', arg.where.id_type.type)
    })
    prisma.oidcModel.upsert.mockImplementation(({ create }) => {
      if (create.type === 10) {
        interactionsDB[create.id] = create
        console.log('upserted interaction', create.id, create.payload.prompt)
        return
      }
      if (create.type === 1) {
        sessionDB[create.id] = create
        return
      }
      console.log('not saved!', create.type)
    })
    const interactionsDB = {}
    const baseUrl = `http://localhost:${port}`
    const goodchallenge = { code_challenge: generators.codeChallenge('abc'), code_challenge_method: 'S256' }
    const q = stringify({ client_id: 'goodclient', redirect_uri: 'https://somerp.com/cb', response_type: 'code', ...goodchallenge, scope: 'openid' })
    const url = `${baseUrl}/oidc/auth/?${q}`
    const { statusCode, headers } = await got(url, { followRedirect: false })

    expect(statusCode).toEqual(303)
    expect(headers.location).toMatch('/interaction')

    const loginResponse = await got.post(`${baseUrl}${headers.location}/login`, {
      followRedirect: false, // important to not follow redirects
      headers: {
        Cookie: headers['set-cookie'].join(';')
      },
      form: {
        login: 'lecler',
        password: 'icme'
      }
    })

    const authLocation = loginResponse.headers.location
    expect(authLocation).toMatch(/oidc\/auth/) // .../oidc/auth/X0oCrM5oL7N_gDFzJNyqV
    expect(loginResponse.statusCode).toEqual(303)

    const consentInteraction = await got(authLocation, {
      followRedirect: false,
      headers: {
        Cookie: headers['set-cookie'].join(';')
      }
    })

    const sessCookies = skp(consentInteraction.headers['set-cookie']).filter(ck => ck.name.startsWith('_session'))
    expect(sessCookies.length).toEqual(4)
    expect(consentInteraction.statusCode).toEqual(303)
    expect(consentInteraction.headers.location).toMatch(/interaction/)
  })
})
