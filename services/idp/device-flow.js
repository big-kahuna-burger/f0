#!/usr/bin/env node

/* eslint-disable no-console, camelcase */

import open from 'open'
import { Issuer } from 'openid-client'
import QRCode from 'qrcode'

const { ISSUER = 'https://f0.pchele.com/oidc' } = process.env
const GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code'
const initialAccessToken =
  process.argv[2] || 'O57ZlfnNckh13-Fi3hqXyo8ZFmi2suT13BbY5qUJreY'
;(async () => {
  const issuer = await Issuer.discover(ISSUER)

  const client = await issuer.Client.register(
    {
      grant_types: [GRANT_TYPE],
      response_types: [],
      redirect_uris: [],
      token_endpoint_auth_method: 'none',
      application_type: 'native'
    },
    { initialAccessToken }
  )
  console.log(client)
  const handle = await client.deviceAuthorization()

  QRCode.toString(
    handle.verification_uri_complete,
    { type: 'terminal', small: true },
    (err, url) => {
      console.log(url)
    }
  )
  await open(handle.verification_uri_complete, { wait: false })

  const tokenSet = await handle.poll()

  console.log('got', tokenSet)
  console.log('id token claims', tokenSet.claims())

  const userinfo = await client.userinfo(tokenSet)
  console.log('userinfo', userinfo)
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
