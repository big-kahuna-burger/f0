// This file contains code that we reuse
// between our tests.
process.env.ENV = 'test'
import { vi } from 'vitest'
import prisma from '../db/__mocks__/client.js'
import '../env.js'
import { setupPrisma } from './tests.dbmock.js'

vi.mock('../db/client.js')
// Fill in this config with all the configurations
// needed for testing the application
async function config(opts = {}) {
  return {
    ...opts
  }
}

// automatically build and tear down our instance
async function build(opts) {
  await setupPrisma(prisma)
  const { default: makeFastify } = await import('../server.js')
  const fastify = await makeFastify(await config(opts))
  fastify.log.level = 'silent'
  return fastify
}

export { config, build }
