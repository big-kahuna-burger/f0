// import './otel.js'
import './oidc/helpers/config.js'

import middie from '@fastify/middie'
import closeWithGrace from 'close-with-grace'
import { filename } from 'desm'
import { fastify as Fastify } from 'fastify'
import { configureOidc } from './oidc/index.js'

const { ISSUER, FASTIFY_CLOSE_GRACE_DELAY = 500 } = process.env
const { port } = new URL(ISSUER)

export default makeFastify

async function makeFastify(config, pretty) {
  const parsedHost = new URL(config?.issuer || ISSUER)
  const { hostname, protocol, port, pathname } = parsedHost
  if (pathname === '/') {
    throw new Error(
      'You should provide a path/prefix for the issuer. ' +
        "Can't mount it to root. In env vars ISSUER=https://mydomain.com/oidc"
    )
  }

  const { provider, Account, AccountErrors } = await configureOidc(
    `${protocol}//${hostname}${port ? `:${port}` : ''}${pathname}`
  )

  const transport = pretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true
        }
      }
    : false

  const logger = {
    msgPrefix: '[f0]: ',
    transport
  }
  const fastifyOpts = { logger }

  const app = Fastify(fastifyOpts)
  await app.register(middie)

  const oidCallback = provider.callback()
  app.use(pathname, oidCallback)

  const appService = await import('./app.js')
  await app.register(appService, {
    oidc: provider,
    otel: { wrapRoutes: true },
    Account,
    AccountErrors,
    grantsDebug: true
  })

  // delay is the number of milliseconds for the graceful close to finish
  const GRACE_DELAY = FASTIFY_CLOSE_GRACE_DELAY || 500
  const closeListeners = closeWithGrace(
    { delay: GRACE_DELAY },
    gracefullCallback
  )

  app.addHook('onClose', onCloseHook)

  return app

  async function gracefullCallback({ signal, err, manual }) {
    if (err) {
      app.log.error(err)
    }
    await app.close()
  }

  async function onCloseHook(instance, done) {
    closeListeners.uninstall()
    done()
  }
}

async function start(port, pretty) {
  const app = await makeFastify(null, pretty)
  await app.ready()
  // console.log(
  //   app.printRoutes({ includeHooks: true, includeMeta: ['errorHandler'] })
  // )
  const listenOpts = { port, listenTextResolver }
  await app.listen(listenOpts)

  function listenTextResolver() {
    return `OP metadata at http://localhost:${port}/oidc/.well-known/openid-configuration`
  }
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = filename(import.meta.url)
  const pretty = true

  if (process.argv[1] === modulePath) {
    await start(port, pretty)
  }
}
