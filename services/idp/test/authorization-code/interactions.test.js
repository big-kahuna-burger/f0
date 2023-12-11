import { describe, expect, test, beforeEach } from 'vitest'
import got from 'got'
import skp from 'set-cookie-parser'
import { stringify } from 'querystring'
import { generators } from 'openid-client'
import { build } from '../helper.js'
import { decode } from '../../helpers/base64url.js'
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

  test('auth -> login rendered with title', async (ctx) => {
    // prepare client db mock
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
      if (arg.where.id_type.type === 13) {
        return grantsDB[arg.where.id_type.id]
      }
      if (arg.where.id_type.type === 3) {
        return authCodes[arg.where.id_type.id]
      }
      console.log(arg)
    })
    prisma.oidcModel.delete.mockImplementation((arg) => {
      if (arg.where.id_type.type === 10) {
        delete interactionsDB[arg.where.id_type.id]
        return
      }
      if (arg.where.id_type.type === 1) {
        delete sessionDB[arg.where.id_type.id]
        return
      }
      console.log({ arg })
    })
    // adapter.upsert
    prisma.oidcModel.upsert.mockImplementation(({ create, ...otherOpts }) => {
      if (create.type === 10) {
        interactionsDB[create.id] = create
        return
      }

      if (create.type === 1) {
        sessionDB[create.id] = create
        return
      }

      if (create.type === 13) {
        grantsDB[create.id] = create
        return
      }

      if (create.type === 3) {
        authCodes[create.id] = create
      }
      // console.log('accessToken created ', create.payload)
    })
    // adapter.findByUid
    prisma.oidcModel.findFirst.mockImplementation(({ where: { uid } }) => {
      const filtered = Object.values(sessionDB).filter(s => s.uid === uid)
      return filtered[0]
    })

    const interactionsDB = {}
    const grantsDB = {}
    const authCodes = {}
    const codeVerifier = generators.codeVerifier()
    const baseUrl = `http://localhost:${port}`
    const goodchallenge = { code_challenge: generators.codeChallenge(codeVerifier), code_challenge_method: 'S256' }
    const q = stringify({ client_id: 'goodclient', redirect_uri: 'https://somerp.com/cb', response_type: 'code', ...goodchallenge, scope: 'openid' })
    const url = `${baseUrl}/oidc/auth/?${q}`

    const { statusCode, headers } = await got(url, { followRedirect: false })
    console.log('RP -> (GET) IDP/auth redirects to login', { startsFrom: url, statusCode, location: headers.location })

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
    console.log('Browser -> (POST) IDP/interaction/:uid/login redirects to auth', {
      statusCode: loginResponse.statusCode,
      location: authLocation
    })
    expect(authLocation).toMatch(/oidc\/auth/) // .../oidc/auth/X0oCrM5oL7N_gDFzJNyqV
    expect(loginResponse.statusCode).toEqual(303)

    const consentInteraction = await got(authLocation, {
      followRedirect: false,
      headers: {
        Cookie: headers['set-cookie'].join(';')
      }
    })
    console.log('Browser -> (GET) IDP/auth redirects to consent', {
      statusCode: consentInteraction.statusCode,
      location: consentInteraction.headers.location
    })
    const sessCookies = skp(consentInteraction.headers['set-cookie']).filter(ck => ck.name.startsWith('_session'))
    expect(sessCookies.length).toEqual(4)
    expect(consentInteraction.statusCode).toEqual(303)
    expect(consentInteraction.headers.location).toMatch(/interaction/)

    const consentPage = await got(`${baseUrl}${consentInteraction.headers.location}`, {
      followRedirect: false,
      headers: {
        Cookie: [...consentInteraction.headers['set-cookie']].join(';')
      }
    })

    console.log('Browser -> (GET) IDP/interaction/:uid (consent)', { statusCode: consentPage.statusCode })

    expect(consentPage.statusCode).toEqual(200)
    const containsTitle = consentPage.body.includes('<title>Authorize</title>')
    expect(containsTitle).toBe(true)

    const consentConfirmed = await got.post(`${baseUrl}${consentInteraction.headers.location}/confirm`, {
      followRedirect: false,
      headers: {
        Cookie: [...consentInteraction.headers['set-cookie']].join(';')
      }
    })

    const consentConfirmedAuthResume = consentConfirmed.headers.location
    expect(consentConfirmedAuthResume).toMatch(/oidc\/auth/)
    console.log('Browser -> (POST) IDP/interaction/:uid/confirm (consent)', { statusCode: consentPage.statusCode, location: consentConfirmedAuthResume })
    const rpRedirect = await got(consentConfirmedAuthResume, {
      followRedirect: false,
      headers: {
        Cookie: [...consentInteraction.headers['set-cookie']].join(';')
      }
    })
    const rpCodeUrl = rpRedirect.headers.location
    const { searchParams, pathname, host, protocol } = new URL(rpCodeUrl)
    const { code, iss } = Object.fromEntries(searchParams)

    console.log(`Browser -> (GET) RP ${protocol}//${host}${pathname}?code=${code}&iss=${iss}`)

    expect(iss).toBe('http://idp.dev:9876/oidc')
    expect(code.length).toBe(43)
    expect(`${protocol}//${host}${pathname}`).toBe(clientMock.payload.redirect_uris[0])

    const tokenUrl = `${baseUrl}/oidc/token`

    const token = await got.post(tokenUrl, {
      form: {
        client_id: clientMock.payload.client_id,
        grant_type: 'authorization_code',
        code,
        redirect_uri: clientMock.payload.redirect_uris[0],
        code_verifier: codeVerifier
      }
    })

    const {
      // eslint-disable-next-line
      access_token: accessToken,
      expires_in: expiresIn,
      id_token: idToken,
      scope,
      token_type: tokenType
    } = JSON.parse(token.body)

    console.log('RP Client -> (POST) IDP/token', { statusCode: token.statusCode, body: token.body })

    expect(accessToken).toBeTruthy()
    expect(expiresIn).toEqual(3600)
    expect(idToken).toBeTruthy()
    expect(scope).toEqual('openid')
    expect(tokenType).toEqual('Bearer')
    const atHeader = idToken.split('.')[0]
    const decoded = decode(atHeader)
    const header = JSON.parse(decoded.toString())
    expect(header).toEqual({ alg: 'RS256', typ: 'JWT', kid: 'testkey1' })
  })
})
