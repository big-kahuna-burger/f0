import { stringify } from 'querystring'
import got from 'got'
import { generators } from 'openid-client'
import skp from 'set-cookie-parser'
import { beforeEach, describe, expect, test } from 'vitest'
import { decode } from '../../oidc/helpers/base64url.js'
import * as helper from '../helper.js'
import { clientMock } from '../tests.dbmock.js'

describe('interaction router', () => {
  let fastify
  let port
  beforeEach(async () => {
    // called once before each test run
    fastify = await helper.build()
    await fastify.ready()
    await fastify.listen()
    port = fastify.server.address().port

    // clean up function, called once after each test run
    return async () => {
      await fastify.close()
    }
  })
  test('random interaction hit will produce SessionNotFound', async (t) => {
    const baseUrl = `http://localhost:${port}`
    try {
      await got.get(`${baseUrl}/interaction/random`)
    } catch (error) {
      expect(error?.response?.body).toEqual('Session not found')
    }
  })

  test('from /auth GET -> to /token POST Response', async () => {
    const codeVerifier = generators.codeVerifier()
    const baseUrl = `http://localhost:${port}`
    const goodchallenge = {
      code_challenge: generators.codeChallenge(codeVerifier),
      code_challenge_method: 'S256'
    }
    const q = stringify({
      client_id: clientMock.id,
      redirect_uri: clientMock.payload.redirect_uris[0],
      response_type: 'code',
      ...goodchallenge,
      scope: 'openid'
    })
    const url = `${baseUrl}/oidc/auth/?${q}`
    const { statusCode, headers } = await got(url, { followRedirect: false })
    const interactionResponse = await got(`${baseUrl}${headers.location}`, {
      headers: {
        Cookie: headers['set-cookie'].join(';')
      }
    })
    const containsLoginTitle = interactionResponse.body.includes(
      '<title>Sign-in</title>'
    )
    expect(containsLoginTitle).toBe(true)
    expect(statusCode).toEqual(303)
    expect(headers.location).toMatch('/interaction')
    const loginResponse = await got.post(
      `${baseUrl}${headers.location}/login`,
      {
        followRedirect: false, // important to not follow redirects
        headers: {
          Cookie: headers['set-cookie'].join(';')
        },
        form: {
          login: 'johndaasdoe23@examplea1.com',
          password: 'icme'
        }
      }
    )
    const authLocation = loginResponse.headers.location

    expect(authLocation).toMatch(/oidc\/auth/)
    expect(loginResponse.statusCode).toEqual(303)
    const consentInteraction = await got(authLocation, {
      followRedirect: false,
      headers: {
        Cookie: headers['set-cookie'].join(';')
      }
    })
    const sessCookies = skp(consentInteraction.headers['set-cookie']).filter(
      (ck) => ck.name.startsWith('_session')
    )

    expect(consentInteraction.headers.location).toMatch(/interaction/)
    expect(
      sessCookies.length,
      'expecting 4 session cookies for a logged in user'
    ).toEqual(4)

    expect(consentInteraction.statusCode).toEqual(303)
    const consentPage = await got(
      `${baseUrl}${consentInteraction.headers.location}`,
      {
        followRedirect: false,
        headers: {
          Cookie: [...consentInteraction.headers['set-cookie']].join(';')
        }
      }
    )
    expect(consentPage.statusCode).toEqual(200)
    const containsTitle = consentPage.body.includes('<title>Authorize</title>')
    expect(containsTitle).toBe(true)
    const consentConfirmed = await got.post(
      `${baseUrl}${consentInteraction.headers.location}/confirm`,
      {
        followRedirect: false,
        headers: {
          Cookie: [...consentInteraction.headers['set-cookie']].join(';')
        }
      }
    )
    const consentConfirmedAuthResume = consentConfirmed.headers.location
    expect(consentConfirmedAuthResume).toMatch(/oidc\/auth/)
    const rpRedirect = await got(consentConfirmedAuthResume, {
      followRedirect: false,
      headers: {
        Cookie: [...consentInteraction.headers['set-cookie']].join(';')
      }
    })
    const rpCodeUrl = rpRedirect.headers.location
    const { searchParams, pathname, host, protocol } = new URL(rpCodeUrl)
    const { code, iss } = Object.fromEntries(searchParams)
    expect(iss).toBe('http://localhost:9876/oidc')
    expect(code.length).toBe(43)
    expect(`${protocol}//${host}${pathname}`).toBe(
      clientMock.payload.redirect_uris[0]
    )
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
      access_token: accessToken,
      expires_in: expiresIn,
      id_token: idToken,
      scope,
      token_type: tokenType
    } = JSON.parse(token.body)
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
