// This file contains code that we reuse
// between our tests.
import '../helpers/config.js'

import { fileURLToPath } from 'url'
import path from 'path'

import { vi } from 'vitest'
import makeFastify from '../server.js'

import prisma from '../../db/__mocks__/client.js'
import { readFile } from 'fs/promises'
process.env.ENV = 'test'

vi.mock('../../db/client.js')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testKeys = JSON.parse((await readFile(path.join(__dirname, './jwks.json'))).toString())

// Fill in this config with all the configurations
// needed for testing the application
async function config (opts) {
  return {
    ...opts
    // oidc: (await configureOidc())
  }
}

// automatically build and tear down our instance
async function build (opts) {
  // you can set all the options supported by the fastify CLI command
  const dbConf = { jwks: testKeys }
  prisma.config.findMany.mockResolvedValue([dbConf])
  prisma.config.findFirst.mockResolvedValue(dbConf)

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const fastify = await makeFastify(await config(opts))
  fastify.log.level = 'silent'
  return fastify
}

export {
  config,
  build
}
