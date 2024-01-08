import { CodeHighlight } from '@mantine/code-highlight'
import { Paper } from '@mantine/core'

const privateKeyBlock = ({ issuer, client_id } = {}) => `const { readFile } = require('fs/promises')
const crypto = require('crypto')
const http = require('http')

const { SignJWT } = require('jose')
const uuid = require('uuid')

async function main() {
  const pk = // read your private key here
  const privateKeyPEM = crypto.createPrivateKey(pk)
  const signedJwt = await new SignJWT({})
    .setProtectedHeader({ 
       alg: 'RS256', // or RS384 or PS256
       kid: '(OPTIONAL)' 
    })
    .setIssuedAt()
    .setExpirationTime('1m')
    .setJti(uuid.v4())
    .setIssuer('${client_id}')
    .setSubject('${client_id}')
    .setAudience('${issuer}')
    .sign(privateKeyPEM)

    
  const data = {
    grant_type: 'client_credentials',
    client_id: '${client_id}',
    client_assertion_type:
    'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: signedJwt
  }
  
  const dataPayload = new URLSearchParams(data).toString()
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(dataPayload)
    }
  }
    
  const url = '${issuer}/token'
  const req = http.request(url, options, (res) => {
    let responseData = ''
    res.on('data', (chunk) => {
      responseData += chunk
    })
    res.on('end', () => {
      console.log(responseData)
    })
  })

  req.on('error', (error) => {
    console.error(error)
  })

  req.write(dataPayload)
  req.end()
}

main()`

const codeBlock = ({
  client_id,
  issuer = process.env.REACT_APP_ISSUER,
  audience,
  token_endpoint_auth_method,
  response_types,
  redirect_uri,
  redirect_uris,
  client_secret
}) =>
  token_endpoint_auth_method === 'private_key_jwt'
    ? privateKeyBlock({ issuer, client_id })
    : `const server = require('http').createServer().listen(9988)

const { Issuer, generators } = require('openid-client')

server.removeAllListeners('request')
const {
  OIDC_CLIENT_ID = '${client_id}',
  OIDC_ISSUER = '${issuer}'${
    client_secret
      ? `,
  OIDC_CLIENT_SECRET = '${client_secret}'`
      : ''
  }
} = process.env

server.once('listening', () => {
  ;(async () => {
    const issuer = await Issuer.discover(OIDC_ISSUER)
    const { address, port } = server.address()
    const redirect_uri = '${redirect_uri}'

    const client = new issuer.Client({
      client_id: OIDC_CLIENT_ID${
        client_secret
          ? `,
      client_secret: OIDC_CLIENT_SECRET,`
          : ','
      }
      redirect_uris: ${redirect_uris},
      response_types: ${response_types},
      token_endpoint_auth_method: '${token_endpoint_auth_method}'
    })
    const code_verifier = generators.codeVerifier()
    const code_challenge = generators.codeChallenge(code_verifier)

    server.on('request', async (req, res) => {
      res.setHeader('connection', 'close')
      const params = client.callbackParams(req)

      if (Object.keys(params).length) {
        const tokenSet = await client.callback(
          redirect_uri,
          params,
          { code_verifier, response_type: 'code' }
        )

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
})`

const QuickStart = ({ app }) => {
  const redirectUris = app.redirect_uris ? app.redirect_uris.split(',') : []
  const fixed = {
    ...app,
    redirect_uris: renderArry(redirectUris),
    response_types: renderArry(app.response_types),
    redirect_uri: redirectUris[0]
  }
  const cb = codeBlock(fixed)
  return (
    <Paper>
      <CodeHighlight code={cb} maw={850} language="js" highlightOnClient />
    </Paper>
  )
}
export default QuickStart

function renderArry(arr) {
  return `[${arr.map((ru) => `'${ru}'`).join(', ')}]`
}
