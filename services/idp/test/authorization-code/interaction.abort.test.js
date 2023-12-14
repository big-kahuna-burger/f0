import { stringify } from 'querystring'
import got from 'got'
import { generators } from 'openid-client'
import skp from 'set-cookie-parser'
import { beforeEach, describe, expect, test } from 'vitest'
import prisma from '../../db/__mocks__/client.js'
import { decode } from '../../helpers/base64url.js'
import { build } from '../helper.js'

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

  
  test('random interaction hit will produce SessionNotFound', async (t) => {
    const baseUrl = `http://localhost:${port}`
    try {
      await got.get(`${baseUrl}/interaction/random`)
    } catch (error) {
      expect(error.response.body).toEqual('Session not found')
    }
  })
  test('interaction can be aborted and message sent to RP back', async (t) => {
    const {
      default: { clientMock }
    } = await import('../tests.dbmock.js')
    const baseUrl = `http://localhost:${port}`
    const codeVerifier = generators.codeVerifier()
    const goodchallenge = {
      code_challenge: generators.codeChallenge(codeVerifier),
      code_challenge_method: 'S256'
    }
    const q = stringify({
      client_id: 'goodclient',
      redirect_uri: 'https://somerp.com/cb',
      response_type: 'code',
      ...goodchallenge,
      scope: 'openid'
    })
    const url = `${baseUrl}/oidc/auth/?${q}`

    const { statusCode: startAuthStatus, headers: loginHeaders } = await got(
      url,
      {
        followRedirect: false
      }
    )
    expect(startAuthStatus).toEqual(303)
    const interactionPath = loginHeaders.location
    const { statusCode: abortStatus, headers: abortHeaders } = await got.get(
      `${baseUrl}${interactionPath}/abort`,
      {
        followRedirect: false,
        headers: { Cookie: loginHeaders['set-cookie'].join(';') }
      }
    )
    expect(abortStatus).toEqual(303)
    const { statusCode: abortRedirect, headers: abortRedirectHeaders } =
      await got.get(abortHeaders.location, {
        followRedirect: false,
        headers: { Cookie: loginHeaders['set-cookie'].join(';') }
      })

    expect(abortRedirect).toEqual(303)
    expect(abortRedirectHeaders.location).toBeTruthy()

    const rpRedirect = new URL(abortRedirectHeaders.location)

    expect(rpRedirect.protocol).toEqual('https:')
    expect(rpRedirect.hostname).toEqual('somerp.com')
    expect(rpRedirect.pathname).toEqual('/cb')

    const { error, error_description, iss } = Object.fromEntries(
      rpRedirect.searchParams
    )
    expect(iss).toEqual('http://idp.dev:9876/oidc')
    expect(error).toEqual('access_denied')
    expect(error_description).toEqual('End-User aborted interaction')
  })
})