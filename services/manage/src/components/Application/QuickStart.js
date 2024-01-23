import { CodeHighlight } from '@mantine/code-highlight'
import { Paper, Select } from '@mantine/core'
import { useEffect, useState } from 'react'
const privateKeyBlockClientCredentials = ({
  issuer,
  client_id,
  alg,
  kid
} = {}) => `const { readFile } = require('fs/promises')
const crypto = require('crypto')
const http = require('http')

const { SignJWT } = require('jose')
const uuid = require('uuid')

async function main() {
  const pk = // read your private key here
  const privateKeyPEM = crypto.createPrivateKey(pk)
  const signedJwt = await new SignJWT({})
    .setProtectedHeader({ 
       alg: '${alg}',
       kid: '${kid}' // it's optional
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
  client_secret,
  alg,
  kid,
  selectedGrantType
}) => {
  if (selectedGrantType === 'client_credentials') {
    switch (token_endpoint_auth_method) {
      case 'private_key_jwt':
        return privateKeyBlockClientCredentials({ issuer, client_id, alg, kid })
      case 'client_secret_basic':
      case 'client_secret_post':
      case 'none':
        return clientSecretBasicClientCredentials({
          issuer,
          client_id,
          client_secret,
          alg,
          kid
        })
      default:
        return 'not implemented yet'
    }
  }
  if (selectedGrantType === 'authorization_code') {
    switch (token_endpoint_auth_method) {
      case 'private_key_jwt':
        return authCodeGrantTypeJwk({
          client_id,
          issuer,
          audience,
          response_types,
          redirect_uri,
          redirect_uris,
          alg,
          kid
        })
      default:
        return authCodeGrantType({
          client_id,
          issuer,
          audience,
          token_endpoint_auth_method,
          response_types,
          redirect_uri,
          redirect_uris,
          client_secret
        })
    }
  }
  return 'NI'
}

const clientSecretBasicClientCredentials = ({
  issuer,
  client_id,
  client_secret,
  alg,
  kid
}) => 'const TODO = true'
const authCodeGrantTypeJwk = ({
  client_id,
  issuer,
  audience,
  response_types,
  redirect_uri,
  redirect_uris,
  alg,
  kid
}) => `const server = require('http').createServer().listen(9988)

const { Issuer, generators } = require('openid-client')

server.removeAllListeners('request')
const {
  OIDC_CLIENT_ID = '${client_id}',
  OIDC_ISSUER = '${issuer}'
} = process.env

server.once('listening', () => {
  ;(async () => {
    const issuer = await Issuer.discover(OIDC_ISSUER)
    const { address, port } = server.address()
    const redirect_uri = '${redirect_uri}'

    const client = new issuer.Client({
      client_id: OIDC_CLIENT_ID,
      redirect_uris: ${redirect_uris},
      response_types: ${response_types},
      token_endpoint_auth_method: 'private_key_jwt'
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

const authCodeGrantType = ({
  client_id,
  issuer,
  audience,
  token_endpoint_auth_method,
  response_types,
  redirect_uri,
  redirect_uris,
  client_secret
}) => `const server = require('http').createServer().listen(9988)

const { Issuer, generators } = require('openid-client')

server.removeAllListeners('request')
const {
  OIDC_CLIENT_ID = '${client_id}',
  OIDC_ISSUER = '${issuer}'${client_secret
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
      client_id: OIDC_CLIENT_ID${client_secret
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
  const [selectedGrantType, setSelectedGrantType] =
    useState('client_credentials')
  const redirectUris = app.redirect_uris ? app.redirect_uris.split(',') : []
  const fixedApp = {
    ...app,
    redirect_uris: renderArry(redirectUris),
    response_types: renderArry(app.response_types),
    redirect_uri: redirectUris[0]
  }
  const [selectedCredential, setSelectedCredential] = useState()
  const [alg, setAlg] = useState()
  const [kid, setKid] = useState()
  useEffect(() => {
    if (selectedCredential && selectedCredential !== 'N/A') {
      const cred = app.jwks?.keys?.find(
        (cred) => cred.kid === selectedCredential
      )
      const { alg, kid } = cred
      setAlg(alg)
      setKid(kid)
    }
  }, [app, selectedCredential])

  const options =
    app.jwks?.keys?.map((cred) => ({
      label: `${cred.alg} 🔑 ${cred.kid} ` || 'N/A',
      value: cred.kid || 'N/A'
    })) || []

  return (
    <>
      <Select
        variant="outline"
        onChange={(v) => setSelectedGrantType(v)}
        placeholder="Select a grant type"
        data={[
          {
            label: 'client_credentials',
            value: 'client_credentials'
          },
          {
            label: 'authorization_code',
            value: 'authorization_code'
          }
        ]}
        miw={450}
      />
      {app.token_endpoint_auth_method === 'private_key_jwt' ? (
        <Paper>
          <Select
            variant="outline"
            onChange={(v) => setSelectedCredential(v)}
            placeholder="Select a credential"
            data={options}
            miw={450}
          />

          {selectedCredential && (
            <CodeHighlight
              code={codeBlock({ alg, kid, ...fixedApp, selectedGrantType })}
              language="js"
            />
          )}
        </Paper>
      ) : (
        <CodeHighlight
          code={codeBlock({ ...fixedApp, selectedGrantType })}
          language="js"
        />
      )}
    </>
  )
}
export default QuickStart

function renderArry(arr) {
  return `[${arr.map((ru) => `'${ru}'`).join(', ')}]`
}
