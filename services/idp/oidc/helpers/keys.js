import { exportJWK, generateKeyPair } from 'jose'
import nanoid from 'oidc-provider/lib/helpers/nanoid.js'
import prisma from '../../db/client.js'

const ALGS_SUPPORTED = new Set(['ES256', 'PS256'])
const ALG_TO_KTY = new Map(
  Object.entries({
    ES256: 'EC',
    PS256: 'RSA'
  })
)

/**
 * Initializes the keys for the OIDC provider.
 * If no configuration exists in the database, it creates a new one with generated keys.
 * If the configuration exists but has less than 2 keys, it adds the missing keys.
 * If the configuration exists but has no cookie keys, it generates and adds them.
 * @returns {Promise<void>} A promise that resolves when the keys are initialized.
 */
async function initializeKeys() {
  const configs = await prisma.config.findMany()

  const [privateEC, privateRSA] = await Promise.all(
    ['ES256', 'PS256'].map((v) =>
      generateKeyPair(v).then(({ privateKey }) => exportJWK(privateKey))
    )
  )

  if (!configs || !configs.length) {
    const result = await prisma.config.create({
      data: {
        jwks: [privateEC, privateRSA],
        cookieKeys: [nanoid(), nanoid()]
      }
    })
    return
  }

  const { id, jwks, cookieKeys } = configs[0]
  if (jwks.length < 2) {
    const result = await prisma.config.update({
      where: { id: id },
      data: { jwks: [privateEC, privateRSA] }
    })
    return result
  }
  if (!cookieKeys || cookieKeys.length < 2) {
    const cookieSecrets = [nanoid(), nanoid()]
    await prisma.config.update({
      where: { id: id },
      data: { cookieKeys: cookieSecrets }
    })
  }
}
/**
 * Retrieves the configuration from the database.
 * @returns {Promise<Object>} A promise that resolves with the configuration object.
 */
async function getConfig() {
  return prisma.config.findFirst()
}

/**
 * Naive key rotation implementation. Would need a key history record to be auditable.
 * Rotates the key for the specified algorithm.
 * Throws an error if the algorithm is not supported or if the configuration is not properly initialized.
 * @param {string} alg - The algorithm to rotate the key for (must be 'ES256' or 'PS256').
 * @returns {Promise<void>} A promise that resolves when the key rotation is complete.
 * @throws {Error} If the algorithm is not supported or if the configuration is not properly initialized.
 */

async function rotateKey(alg) {
  if (!ALGS_SUPPORTED.has(alg)) {
    throw new Error('alg must be one of ES256|RS256')
  }

  const config = await getConfig()

  if (!config || config.jwks.length < 2) {
    throw new Error(
      'you should run initializeKeys from db/helpers/keys.js first'
    )
  }

  const kty = ALG_TO_KTY.get(alg)

  const generated = await exportJWK((await generateKeyPair(alg)).privateKey)
  const filtered = config.jwks.filter((key) => key.kty === kty)
  const nextJwks = [...config.jwks]
  switch (filtered.length) {
    case 0:
    case 1:
    case 2:
      nextJwks.push(generated)
      break
    default:
      nextJwks.splice(
        nextJwks.findIndex((key) => key.kty === kty),
        1
      )
      nextJwks.push(generated)
      break
  }

  await prisma.config.update({
    where: { id: config.id },
    data: { jwks: nextJwks }
  })
}

export { initializeKeys, getConfig, rotateKey }
