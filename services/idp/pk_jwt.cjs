const { SignJWT } = require('jose')
const crypto = require('crypto')
const uuid = require('uuid')
const { readFile } = require('fs/promises')
const http = require('http')

async function main() {
  const pk = await readFile('./test_key.pem')
  const privateKeyPEM = crypto.createPrivateKey(pk)
  const signedJwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('1m')
    .setJti(uuid.v4())
    .setIssuer('yXBRcQvj8shwFyuGz9pV_')
    .setSubject('yXBRcQvj8shwFyuGz9pV_')
    .setAudience('http://localhost:9876/oidc')
    .sign(privateKeyPEM)
  const url = 'http://localhost:9876/oidc/token'

  const data = {
    grant_type: 'client_credentials',
    client_id: 'yXBRcQvj8shwFyuGz9pV_',
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
