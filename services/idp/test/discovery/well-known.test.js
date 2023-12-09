'use strict'

import { test, beforeEach, beforeAll, expect } from 'vitest'
import got from 'got'

import { build } from '../helper.js'
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

test('.well-known is working', async (t) => {
  const { body, statusCode, headers } = await got(`http://localhost:${port}/.well-known/openid-configuration`)
  
  expect(statusCode).toEqual(200)
  expect(headers['content-type']).toEqual('application/json; charset=utf-8')
  expect(JSON.parse(body)).toMatchObject(expected(port))
})

const expected = port => ({
  authorization_endpoint: `http://localhost:${port}/auth`,
  device_authorization_endpoint: `http://localhost:${port}/device/auth`,
  claims_parameter_supported: false,
  claims_supported: [
    'sub',
    'address',
    'email',
    'email_verified',
    'phone_number',
    'phone_number_verified',
    'birthdate',
    'family_name',
    'gender',
    'given_name',
    'locale',
    'middle_name',
    'name',
    'nickname',
    'picture',
    'preferred_username',
    'profile',
    'updated_at',
    'website',
    'zoneinfo',
    'sid',
    'auth_time',
    'iss'
  ],
  code_challenge_methods_supported: [
    'S256'
  ],
  end_session_endpoint: `http://localhost:${port}/session/end`,
  grant_types_supported: [
    'implicit',
    'authorization_code',
    'refresh_token',
    'client_credentials',
    'urn:ietf:params:oauth:grant-type:device_code'
  ],
  issuer: 'http://idp.dev:9876',
  jwks_uri: `http://localhost:${port}/jwks`,
  authorization_response_iss_parameter_supported: true,
  response_modes_supported: [
    'form_post',
    'fragment',
    'query'
  ],
  response_types_supported: [
    'code id_token',
    'code',
    'id_token',
    'none'
  ],
  scopes_supported: [
    'openid',
    'offline_access',
    'address',
    'email',
    'phone',
    'profile'
  ],
  subject_types_supported: [
    'public'
  ],
  token_endpoint_auth_methods_supported: [
    'client_secret_basic',
    'client_secret_jwt',
    'client_secret_post',
    'private_key_jwt',
    'none'
  ],
  token_endpoint_auth_signing_alg_values_supported: [
    'HS256',
    'RS256',
    'PS256',
    'ES256',
    'EdDSA'
  ],
  token_endpoint: `http://localhost:${port}/token`,
  id_token_signing_alg_values_supported: [
    'PS256',
    'RS256',
    'ES256'
  ],
  pushed_authorization_request_endpoint: `http://localhost:${port}/request`,
  request_parameter_supported: false,
  request_uri_parameter_supported: false,
  userinfo_endpoint: `http://localhost:${port}/me`,
  revocation_endpoint: `http://localhost:${port}/token/revocation`,
  claim_types_supported: [
    'normal'
  ]
})
