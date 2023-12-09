'use strict'
import './helpers/config.js'

import { readFileSync, existsSync } from 'fs'
import path from 'path'

import Fastify from 'fastify'
import middie from '@fastify/middie'
import closeWithGrace from 'close-with-grace'

import { configureOidc } from './oidc/index.js'
import { dirname, filename } from 'desm'

const __dirname = dirname(import.meta.url)

let parsedHost

try {
  parsedHost = new URL(process.env.ISSUER)
} catch (error) {
  console.error(error)
  process.exit(1)
}

const MY_HOST = parsedHost.hostname || 'idp.dev'
const port = parsedHost.port || 3000
const mountPoint = parsedHost.pathname || '/oidc'

const certFile = path.join(__dirname, `${MY_HOST}.pem`)
const keyFile = path.join(__dirname, `${MY_HOST}-key.pem`)

const localHttps = existsSync(certFile)
  ? {
      key: readFileSync(keyFile),
      cert: readFileSync(certFile),
      ca: readFileSync('/Users/bkb/Library/Application Support/mkcert/rootCA.pem')
    }
  : undefined

const host = localHttps ? `https://${MY_HOST}:${port}` : `http://localhost:${port}`



async function start (config) {
  const app = Fastify({
    logger: true,
    https: localHttps
  })
  await app.register(middie)
  const provider = config?.oidc || (await configureOidc())

  const oidcCallback = provider.callback()

  app.use(mountPoint, oidcCallback)

  const appService = await import('./app.js')
  app.register(appService, { oidc: provider })

  // delay is the number of milliseconds for the graceful close to finish
  const closeListeners = closeWithGrace({ delay: process.env.FASTIFY_CLOSE_GRACE_DELAY || 500 }, async function ({ signal, err, manual }) {
    if (err) {
      app.log.error(err)
    }
    await app.close()
  })

  app.addHook('onClose', async (instance, done) => {
    closeListeners.uninstall()
    done()
  })

  // Start listening.
  app.listen({
    port,
    listenTextResolver: addr => {
      return `OIDC PROVIDER: listening at ${host}. Check metadata at ${host}${mountPoint?.length > 1 ? mountPoint : ''}/.well-known/openid-configuration`
    }
  }, (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
  })

  if (config?.silent) {
    app.log.level = 'silent'
  }

  return app
}

export default start

if (import.meta.url.startsWith('file:')) {
  const modulePath = filename(import.meta.url)
  if (process.argv[1] === modulePath) {
    start()
  }
}
