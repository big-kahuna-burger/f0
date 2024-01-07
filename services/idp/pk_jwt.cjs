'use strict'
const { SignJWT } = require('jose')
const crypto = require('crypto')
const uuid = require('uuid')
const { readFile } = require('fs/promises')

async function main() {
  const pk = await readFile('./test_key.pem')
  const privateKeyPEM = crypto.createPrivateKey(pk)

  const jwt = await new SignJWT({})
    .setProtectedHeader({
      alg: 'RS256'
    })
    .setIssuedAt()
    .setExpirationTime('1m')
    .setJti(uuid.v4())
    .setIssuer('yXBRcQvj8shwFyuGz9pV_')
    .setSubject('yXBRcQvj8shwFyuGz9pV_')
    .setAudience('http://localhost:9876/oidc')
    .sign(privateKeyPEM)
  process.stdout.write(jwt)
}

main()
