import got from 'got'
import { beforeEach, expect, test } from 'vitest'

let fastify
let port
import { build } from '../helper.js'

beforeEach(async () => {
  fastify = await build()
  await fastify.ready()
  await fastify.listen()
  port = fastify.server.address().port
  return async () => {
    await fastify.close()
  }
})

test('.well-known is working', async (t) => {
  const { body, statusCode, headers } = await got(
    `http://localhost:${port}/oidc/.well-known/openid-configuration`
  )

  expect(statusCode).toEqual(200)
  expect(headers['content-type']).toEqual('application/json; charset=utf-8')
  expect(JSON.parse(body)).toMatchObject(expectedMetadata(port))
})

test('/jwks is working', async (t) => {
  const { body, statusCode, headers } = await got(
    `http://localhost:${port}/oidc/jwks`
  )

  expect(statusCode).toEqual(200)
  expect(headers['content-type']).toEqual(
    'application/jwk-set+json; charset=utf-8'
  )
  const { keys } = JSON.parse(body)
  expect(keys).toHaveLength(2)
  const [key1, key2] = keys
  expect(Object.keys(key1)).toStrictEqual(['kty', 'kid', 'e', 'n'])
  const EC_PROPS = ['kty', 'kid', 'crv', 'x', 'y']
  expect(Object.keys(key2)).toStrictEqual(EC_PROPS)
})

const expectedMetadata = (port) => ({
  authorization_endpoint: `http://localhost:${port}/oidc/auth`,
  device_authorization_endpoint: `http://localhost:${port}/oidc/device/auth`,
  dpop_signing_alg_values_supported: ['ES256', 'EdDSA'],
  claims_parameter_supported: true,
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
  code_challenge_methods_supported: ['S256'],
  end_session_endpoint: `http://localhost:${port}/oidc/session/end`,
  grant_types_supported: [
    'implicit',
    'authorization_code',
    'refresh_token',
    'client_credentials',
    'urn:ietf:params:oauth:grant-type:device_code'
  ],
  issuer: 'http://localhost:9876/oidc',
  jwks_uri: `http://localhost:${port}/oidc/jwks`,
  authorization_response_iss_parameter_supported: true,
  response_modes_supported: ['form_post', 'fragment', 'query'],
  response_types_supported: ['code id_token', 'code', 'id_token', 'none'],
  scopes_supported: [
    'openid',
    'offline_access',
    'address',
    'email',
    'phone',
    'profile'
  ],
  subject_types_supported: ['public'],
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
  token_endpoint: `http://localhost:${port}/oidc/token`,
  id_token_signing_alg_values_supported: ['PS256', 'RS256', 'ES256'],
  registration_endpoint: `http://localhost:${port}/oidc/reg`,
  pushed_authorization_request_endpoint: `http://localhost:${port}/oidc/request`,
  request_parameter_supported: false,
  request_uri_parameter_supported: false,
  userinfo_endpoint: `http://localhost:${port}/oidc/me`,
  revocation_endpoint: `http://localhost:${port}/oidc/token/revocation`,
  claim_types_supported: ['normal']
})
