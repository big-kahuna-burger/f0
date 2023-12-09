'use strict'

import { test, beforeEach, expect } from 'vitest'
import { build } from '../helper.js'

const local = {}

beforeEach(async () => {
  // called once before each test run
  local.app = await build({ silent: true })
  // clean up function, called once after each test run
  return async () => {
    await local.app.close()
  }
})

test('.well-known is working', async (t) => {
  const res = await local.app.inject({
    url: '/.well-known/openid-configuration'
  })

  expect(JSON.parse(res.payload)).toMatchObject(expected)
})

const expected = {
  "authorization_endpoint": "http://localhost:80/auth",
  "device_authorization_endpoint": "http://localhost:80/device/auth",
  "claims_parameter_supported": false,
  "claims_supported": [
    "sub",
    "address",
    "email",
    "email_verified",
    "phone_number",
    "phone_number_verified",
    "birthdate",
    "family_name",
    "gender",
    "given_name",
    "locale",
    "middle_name",
    "name",
    "nickname",
    "picture",
    "preferred_username",
    "profile",
    "updated_at",
    "website",
    "zoneinfo",
    "sid",
    "auth_time",
    "iss"
  ],
  "code_challenge_methods_supported": [
    "S256"
  ],
  "end_session_endpoint": "http://localhost:80/session/end",
  "grant_types_supported": [
    "implicit",
    "authorization_code",
    "refresh_token",
    "client_credentials",
    "urn:ietf:params:oauth:grant-type:device_code"
  ],
  "issuer": "https://idp.dev:3000",
  "jwks_uri": "http://localhost:80/jwks",
  "authorization_response_iss_parameter_supported": true,
  "response_modes_supported": [
    "form_post",
    "fragment",
    "query"
  ],
  "response_types_supported": [
    "code id_token",
    "code",
    "id_token",
    "none"
  ],
  "scopes_supported": [
    "openid",
    "offline_access",
    "address",
    "email",
    "phone",
    "profile"
  ],
  "subject_types_supported": [
    "public"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_jwt",
    "client_secret_post",
    "private_key_jwt",
    "none"
  ],
  "token_endpoint_auth_signing_alg_values_supported": [
    "HS256",
    "RS256",
    "PS256",
    "ES256",
    "EdDSA"
  ],
  "token_endpoint": "http://localhost:80/token",
  "id_token_signing_alg_values_supported": [
    "PS256",
    "RS256",
    "ES256"
  ],
  "pushed_authorization_request_endpoint": "http://localhost:80/request",
  "request_parameter_supported": false,
  "request_uri_parameter_supported": false,
  "userinfo_endpoint": "http://localhost:80/me",
  "revocation_endpoint": "http://localhost:80/token/revocation",
  "claim_types_supported": [
    "normal"
  ]
}