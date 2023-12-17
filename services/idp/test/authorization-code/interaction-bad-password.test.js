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

  test('bad password will save interaction error to db', async (ctx) => {
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
          password: 'badpassword'
        }
      }
    )
    expect(loginResponse.statusCode).toEqual(303)

    const loginRepeatedResponse = await got(
      `${loginResponse.headers.location}`,
      {
        followRedirect: false, // important to not follow redirects
        headers: {
          Cookie: headers['set-cookie'].join(';')
        }
      }
    )
    const repeatedInteraction = await got(
      `${baseUrl}${loginRepeatedResponse.headers.location}`,
      {
        followRedirect: false,
        headers: {
          Cookie: loginRepeatedResponse.headers['set-cookie'].join(';')
        }
      }
    )
    const targetRex = /<p id="error" class="red">Invalid email or password<\/p>/
    expect(repeatedInteraction.body).toMatch(targetRex)
  })
})
