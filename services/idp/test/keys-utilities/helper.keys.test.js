import { describe, expect, test, vi } from 'vitest'
import prisma from '../../db/__mocks__/client.js'
import {
  getConfig,
  initializeKeys,
  rotateKey
} from '../../oidc/helpers/keys.js'
import { setupPrisma } from '../tests.dbmock.js'
vi.mock('../../db/client.js')
await setupPrisma(prisma)

describe('key helpers', suite, { timeout: 10000 })

function suite() {
  test('initialize keys with empty config table', async (t) => {
    await initializeKeys()
  })

  test('initialize with missing jwks', async (t) => {
    prisma.config.findMany.mockResolvedValueOnce([{ jwks: [] }])
    prisma.config.update.mockResolvedValueOnce()
    await initializeKeys()
  })

  test('initialize with filled jwks will do nothing', async (t) => {
    prisma.config.findMany.mockResolvedValueOnce([{ jwks: [{}, {}] }])
    await initializeKeys()
  })

  test('get config will return first config found', async (t) => {
    const fakeConfig = { jwks: [{}, {}] }

    prisma.config.findFirst.mockImplementation(() => fakeConfig)
    const returned = await getConfig()
    expect(fakeConfig).toStrictEqual(returned)
  })

  test('rotation will throw when bad alg', async (t) => {
    expect(async () => await rotateKey('pineapples')).rejects.toThrowError(
      'alg must be one of ES256|RS256'
    )
  })

  test('rotation will throw when config is incomplete', async (t) => {
    const fakeConfig = { jwks: [] }
    prisma.config.findFirst.mockImplementation(() => fakeConfig)
    expect(async () => await rotateKey('ES256')).rejects.toThrowError(
      'you should run initializeKeys from db/helpers/keys.js first'
    )
  })

  test('rotation with existing keys', async (t) => {
    const fakeConfig = { jwks: [{ kty: 'RSA' }, { kty: 'RSA' }] }
    prisma.config.findFirst.mockImplementation(() => fakeConfig)
    await rotateKey('ES256')
  })

  test('rotation with existing keys', async (t) => {
    const fakeConfig = { jwks: [{ kty: 'EC' }, { kty: 'EC' }, { kty: 'EC' }] }
    prisma.config.findFirst.mockImplementation(() => fakeConfig)
    await rotateKey('ES256')
  })
}
