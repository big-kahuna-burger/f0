const { readFile } = require('fs/promises')
const crypto = require('crypto')
const http = require('http')

const { SignJWT } = require('jose')
const uuid = require('uuid')

async function main() {
  const pk = await readFile('./test/fixtures/secp256k1.pem')
  const privateKeyPEM = crypto.createPrivateKey(pk)
  const signedJwt = await new SignJWT({})
    .setProtectedHeader({
      alg: 'ES256K'
      //kid: 'hiwHDoFj0sbbSfsAWJ9btyMunxwC2rli-tRgwYrVgWc' // it's optional
    })
    .setIssuedAt()
    .setExpirationTime('1m')
    .setJti(uuid.v4())
    .setIssuer('yXBRcQvj8shwFyuGz9pV_')
    .setSubject('yXBRcQvj8shwFyuGz9pV_')
    .setAudience('http://localhost:9876/oidc')
    .sign(privateKeyPEM)

  const data = {
    grant_type: 'client_credentials',
    client_id: 'yXBRcQvj8shwFyuGz9pV_',
    client_assertion: signedJwt,
    client_assertion_type:
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    resource: 'https://myapi1.com',
    scope: 'adsa asdsadas'
  }

  const dataPayload = new URLSearchParams(data).toString()

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(dataPayload)
    }
  }

  const url = 'http://localhost:9876/oidc/token'
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

main()
