import { createHash } from 'node:crypto'
import { createLocalJWKSet } from 'jose'

const JWK_PRIVATE_PROPS = new Set(['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth'])

export const calculateJwks = async (jwks) => {
  const publicJwksNoKid = jwks.map((key) => {
    return Object.entries(key).reduce((acc, [k, v]) => {
      if (!JWK_PRIVATE_PROPS.has(k)) {
        acc[k] = v
      }
      return acc
    }, {})
  })

  const publicKeys = publicJwksNoKid.map((key) => ({
    ...key,
    kid: key.kid ? key.kid : calculateKid(key)
  }))

  const localSet = createLocalJWKSet({ keys: publicKeys })
  return localSet
}

function calculateKid(jwk) {
  let components

  switch (jwk.kty) {
    case 'RSA':
      components = {
        e: jwk.e,
        kty: 'RSA',
        n: jwk.n
      }
      break
    case 'EC':
      components = {
        crv: jwk.crv,
        kty: 'EC',
        x: jwk.x,
        y: jwk.y
      }
      break
    case 'OKP':
      components = {
        crv: jwk.crv,
        kty: 'OKP',
        x: jwk.x
      }
      break
    default:
      return undefined
  }

  return createHash('sha256')
    .update(JSON.stringify(components))
    .digest()
    .toString('base64url')
}
