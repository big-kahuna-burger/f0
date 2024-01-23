import path from 'path'
import desm from 'desm'
import { readFile } from 'fs/promises'
import { SignJWT, importJWK } from 'jose'
const __dirname = desm(import.meta.url)

const jwks = JSON.parse(
  (await readFile(path.resolve(__dirname, 'jwks.json'))).toString()
)
const jwk = jwks[0]
const alg = 'RS256'
import MANAGEMENT from '../resource-servers/management.js'
const privateKey = await importJWK(jwk, alg)

const ISS = 'http://localhost:9876/oidc'
const AUD = MANAGEMENT.identifier
const SUB = process.env.DASHBOARD_CLIENT_ID
async function sign({
  iss = ISS,
  aud = AUD,
  exp,
  iat,
  sub = SUB,
  jti,
  nbf,
  ...claims
} = {}) {
  const jwt = await new SignJWT(claims)
    .setNotBefore(nbf || '0s')
    .setJti(jti)
    .setSubject(sub || 'urn:example:subject')
    .setProtectedHeader({ alg })
    .setIssuedAt(iat)
    .setIssuer(iss || 'urn:example:issuer')
    .setAudience(aud || 'urn:example:audience')
    .setExpirationTime(exp || '2h')
    .sign(privateKey)
  return jwt
}
export { sign }
