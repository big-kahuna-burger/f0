const server = require('http').createServer().listen(9988)

const { Issuer, generators } = require('openid-client')

server.removeAllListeners('request')
const {
  OIDC_CLIENT_ID = 'm7vmq5wuJdU8plGie26D2',
  OIDC_ISSUER = 'http://localhost:9876/oidc'
} = process.env

server.once('listening', () => {
  ;(async () => {
    const issuer = await Issuer.discover(OIDC_ISSUER)
    const { address, port } = server.address()
    const redirect_uri = 'http://localhost:9988/cb'

    const client = new issuer.Client({
      client_id: OIDC_CLIENT_ID,
      redirect_uris: ['http://localhost:9988/cb'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none'
    })
    const code_verifier = generators.codeVerifier()
    const code_challenge = generators.codeChallenge(code_verifier)

    server.on('request', async (req, res) => {
      res.setHeader('connection', 'close')
      const params = client.callbackParams(req)

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
          scope: 'openid'
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
