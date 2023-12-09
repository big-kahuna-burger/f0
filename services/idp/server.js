'use strict'
import './helpers/config.js'

import { readFileSync, existsSync } from 'fs'

import Fastify from 'fastify'
import middie from '@fastify/middie'
import closeWithGrace from 'close-with-grace'

import { configureOidc } from './oidc/index.js'
import { filename } from 'desm'

async function makeFastify(config, pretty) {
  const parsedHost = new URL(config?.issuer || process.env.ISSUER)

  const { hostname, protocol, port, pathname } = parsedHost

  const mountPoint = pathname.length > 1 ? pathname : ''
  const host = `${protocol}//${hostname}${port ? `:${port}` : ''}${mountPoint}`

  const app = Fastify({
    logger: {
      transport: pretty ? {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      } : false
    }
  })
  await app.register(middie)

  const provider = await configureOidc(host)

  app.use(pathname, provider.callback())

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

  return app
}

async function start(port, pretty) {
  const app = await makeFastify(null, pretty)
  await app.ready()
  const listenOpts = { port, listenTextResolver }
  await app.listen(listenOpts)

  function listenTextResolver() {
    return `OP metadata at http://localhost:${port}/.well-known/openid-configuration`
  }
}

export default makeFastify

if (import.meta.url.startsWith('file:')) {
  const { port } = new URL(process.env.ISSUER)
  const modulePath = filename(import.meta.url)
  const pretty = true
  if (process.argv[1] === modulePath) {
    start(port, pretty)
  }
}
