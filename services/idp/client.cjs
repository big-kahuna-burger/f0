#!/usr/bin/env node

const server = require('http').createServer().listen(0)

const { Issuer, generators } = require('openid-client')

server.removeAllListeners('request')
const { ISSUER = process.argv[2] || 'https://f0.pchele.com/oidc' } = process.env

server.once('listening', () => {
  ;(async () => {
    const issuer = await Issuer.discover(ISSUER)
    const { address, port } = server.address()
    const redirect_uri = `http://${
      address === '::' ? '[::1]' : address
    }:${port}`

    const client = await issuer.Client.register({
      redirect_uris: [redirect_uri],
      application_type: 'native',
      token_endpoint_auth_method: 'none'
    })
    const code_verifier = generators.codeVerifier()
    const code_challenge = generators.codeChallenge(code_verifier)

    server.on('request', async (req, res) => {
      res.setHeader('connection', 'close')
      const params = client.callbackParams(req)

      console.log(params)
      if (Object.keys(params).length) {
        const tokenSet = await client.callback(redirect_uri, params, {
          code_verifier,
          response_type: 'code'
        })

        console.log('got', tokenSet)
        console.log('id token claims', tokenSet.claims())

        const userinfo = await client.userinfo(tokenSet)
        console.log('userinfo', userinfo)

        res.end('you can close this now')
        server.close()
      }
    })
    import('open').then((open) => {
      open.default(
        client.authorizationUrl({
          redirect_uri,
          code_challenge,
          code_challenge_method: 'S256',
          scope: 'openid email',
          prompt: 'login'
        }),
        { wait: false }
      )
    })
  })().catch((err) => {
    console.error(err)
    process.exitCode = 1
    server.close()
  })
})
