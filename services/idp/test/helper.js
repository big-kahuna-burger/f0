// This file contains code that we reuse
// between our tests.
process.env.ENVIRONMENT = 'test'
import '../helpers/config.js'

import start from '../server.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AppPath = path.join(__dirname, '..', 'app.js')

import { configureOidc } from '../oidc/index.js'

// Fill in this config with all the configurations
// needed for testing the application
async function config (conf) {
  return {
    ...conf,
    oidc: (await configureOidc())
  }
}

// automatically build and tear down our instance
async function build (conf) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath]

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await start(await config(conf))

  return app
}

export {
  config,
  build
}
