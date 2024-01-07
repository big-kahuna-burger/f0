import { CodeHighlight } from '@mantine/code-highlight'

const privateKeyBlock = ({ issuer, client_id } = {}) => `const { SignJWT } = require('jose')
const crypto = require("crypto");
const uuid = require("uuid");

async function main() {
 const privateKeyPEM = crypto.createPrivateKey(/**
   Read the content of your private key here. We recommend to store your private key
   in a secure infrastructure. 
 */);

 const jwt = await new SignJWT({})
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
   .sign(privateKeyPEM);
  console.log(jwt)
}

main();`

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
    <>
      <CodeHighlight code={cb} maw={850} language="js" highlightOnClient />
      {app.token_endpoint_auth_method === 'private_key_jwt' && (
        <>
          Save the above code as <code>pk_jwt.cjs</code> and send assertion to
          token endpoint:
          <CodeHighlight
            m="md"
            language=""
            code={curlBlock({ client_id: app.client_id })}
          />
        </>
      )}
    </>
  )
}
export default QuickStart
function curlBlock({ client_id } = {}) {
  return `curl --request POST \\
  --url ${process.env.REACT_APP_ISSUER}/token \\
  --header 'content-type: application/x-www-form-urlencoded' \\
  --data-urlencode 'grant_type=client_credentials' \\
  --data-urlencode 'client_id=${client_id}' \\
  --data-urlencode 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \\
  --data-urlencode 'client_assertion="'$(node pk_jwt.cjs)'"'`
}
function renderArry(arr) {
  return `[${arr.map((ru) => `'${ru}'`).join(', ')}]`
}
