#!/usr/bin/env node

/* eslint-disable no-console, camelcase */
import http from 'http'
import { readFileSync } from 'fs'
import { Issuer, generators, custom } from 'openid-client'
import open from 'open'

const { ISSUER = 'https://idp.dev:3000/op' } = process.env

const server = http.createServer().listen(3002)
server.removeAllListeners('request')

custom.setHttpOptionsDefaults({
  timeout: 5000000,
  checkServerIdentity: (hostname, cert) => {
    console.log(hostname, cert)
  },
  ca: readFileSync('/Users/bkb/Library/Application Support/mkcert/rootCA.pem')
})

server.once('listening', () => {
  (async () => {
    const issuer = await Issuer.discover(ISSUER)
    const redirect_uri = 'http://localhost:3002/cb'
    const client = new issuer.Client({
      client_id: '528da254-b1f4-4881-9ab3-5dfb98addaf5',
      client_secret: 'GSSmbseznQzFEANOvhbGY',
      redirect_uri
      // token_endpoint_auth_method: 'none'
    })
    const code_verifier = generators.codeVerifier()
    const code_challenge = generators.codeChallenge(code_verifier)

    server.on('request', async (req, res) => {
      res.setHeader('connection', 'close')
      const params = client.callbackParams(req)
      if (Object.keys(params).length) {
        const tokenSet = await client.callback(
          redirect_uri, params, { code_verifier, response_type: 'code' }
        )

        console.log('got', tokenSet)
        console.log('id token claims', tokenSet.claims())

        try {
          const userinfo = await client.userinfo(tokenSet)
          console.log('userinfo', userinfo)
        } catch (error) {
          console.log('user info failed', error)
        }
        res.end('you can close this now')
        server.close()
      }
    })

    await open(client.authorizationUrl({
      redirect_uri,
      code_challenge,
      code_challenge_method: 'S256',
      response_type: 'code',
      // scope: 'openid profile email address phone offline_access arandjel',
      scope: 'openid email offline_access',
      prompt: 'login'

      // claims: '{ "userinfo": { "extra_claim_test": { "essential": true } } }',
      // resource: ['https://apps.example.com/scim/Schemas1', 'https://apps.example.com/scim/Groups']
    }), { wait: false })
  })().catch((err) => {
    console.error(err)
    process.exitCode = 1
    server.close()
  })
})
