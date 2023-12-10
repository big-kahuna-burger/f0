import got from 'got'
import { stringify } from 'querystring'
import { describe, expect, test, beforeEach } from 'vitest'
import { build } from '../helper.js'
import prisma from '../../../db/__mocks__/client.js'

describe('authorization code', () => {
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

  test('errors when no args are used', async ({ query, location }) => {
    try {
      await got(`http://localhost:${port}/oidc/auth`)
    } catch (error) {
      expect(error.response.body).toMatch(/oops! something went wrong/)
    }
  })

  test.each`
  query                   | status | matcher
  ${{}}                   | ${400} | ${/missing required parameter &#39;client_id&#39;/}
  ${{ client_id: 'abc' }} | ${400} | ${/client is invalid/}
`('returns status $status with "$query" query', async ({ query, status, matcher }) => {
    try {
      const q = stringify(query)
      const url = `http://localhost:${port}/oidc/auth?${q}`
      await got(url)
    } catch (error) {
      expect(error.response.statusCode).toEqual(status)
      expect(error.response.body).toMatch(matcher)
    }
  })
  const badchallenge = { code_challenge: 'abc', code_challenge_method: 'S256' }

  test.each`
  query                                                                                                 | status | responseQuery
  ${{ client_id: 'v', redirect_uri: 'https://somerp.com/cb' }}                                          | ${303} | ${{ error: 'invalid_request', error_description: "missing required parameter 'response_type'", iss: 'http://idp.dev:9876/oidc' }}
  ${{ client_id: 'v', redirect_uri: 'https://somerp.com/cb', response_type: 'code' }}                   | ${303} | ${{ error: 'invalid_request', error_description: 'Authorization Server policy requires PKCE to be used for this request', iss: 'http://idp.dev:9876/oidc' }}
  ${{ client_id: 'v', redirect_uri: 'https://somerp.com/cb', response_type: 'code', ...badchallenge }}  | ${303} | ${{ error: 'invalid_request', error_description: 'code_challenge must be a string with a minimum length of 43 characters', iss: 'http://idp.dev:9876/oidc' }}
`('returns status $status with "$query" query', async ({ query, status, responseQuery }) => {
    prisma.oidcModel.findUnique.mockResolvedValue({
      payload: {
        client_id: query.client_id,
        redirect_uris: [query.redirect_uri],
        token_endpoint_auth_method: 'none'
      }
    })
    const q = stringify(query)
    const url = `http://localhost:${port}/oidc/auth?${q}`
    const { statusCode, headers } = await got(url, { followRedirect: false })
    expect(statusCode).toEqual(status)
    expect(headers.location).toBeTruthy()
    const { searchParams } = new URL(headers.location)
    expect(Object.fromEntries(searchParams)).toEqual(responseQuery)
  })
})
