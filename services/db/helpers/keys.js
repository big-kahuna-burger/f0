import { generateKeyPair, exportJWK } from 'jose'
import prisma from '../client.js'

const ALGS_SUPPORTED = new Set(['ES256', 'PS256'])
const ALG_TO_KTY = new Map(Object.entries({
  'ES256': 'EC',
  'PS256': 'RSA'
}))

async function initializeKeys() {
  const configs = await prisma.config.findMany()

  const [privateEC, privateRSA] = await Promise.all(
    ['ES256', 'PS256'].map(
      v => generateKeyPair(v)
        .then(({ privateKey }) => exportJWK(privateKey)))
  )

  if (!configs.length) {
    const result = await prisma.config.create({
      data: { jwks: [privateEC, privateRSA] }
    })
    console.log('new config generated and JWK keys added to db', result)
    return
  }

  const { id, jwks } = configs[0]
  if (jwks.length < 2) {
    const result = await prisma.config.update({
      where: { id: id },
      data: { jwks: [privateEC, privateRSA] }
    })

    console.log('initialized JWK in config', result)
    return
  }
  console.log('found JWK in config, nothing changed')

}

async function getConfig() {
  return prisma.config.findFirst()
}


async function rotateKey(alg) {
  if (!ALGS_SUPPORTED.has(alg)) {
    throw new Error(`alg must be one of ES256|RS256`)
  }

  const config = await getConfig()

  if (!config || config.jwks.length < 2) {
    throw new Error('you should run initializeKeys from db/helpers/keys.js first')
  }

  const kty = ALG_TO_KTY.get(alg)
  
  const generated = await exportJWK((await generateKeyPair(alg)).privateKey)
  const filtered = config.jwks.filter(key => key.kty === kty)
  const nextJwks = [...config.jwks]
  switch(filtered.length) {
    case 0:
    case 1:
    case 2:
      nextJwks.push(generated)
      break;
    default:
      nextJwks.splice(nextJwks.findIndex(key => key.kty === kty), 1)
      nextJwks.push(generated)
      break;
  }

  await prisma.config.update({
    where: { id: config.id },
    data: { jwks: nextJwks }
  })
}

export {
  initializeKeys,
  getConfig,
  rotateKey
}