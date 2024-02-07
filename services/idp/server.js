import middie from '@fastify/middie'
import FastifySwagger from '@fastify/swagger'
import Scalar from '@scalar/fastify-api-reference'
import closeWithGrace from 'close-with-grace'
import { filename } from 'desm'
import { fastify as Fastify } from 'fastify'
import './env.js'

import { configureOidc } from './oidc/index.js'
import { getFederationClients } from './oidc/support/federation.js'
import InteractonsAPI from './oidc/support/interaction.js'

import { MANAGEMENT } from './resource-servers/management.js'
import { swaggerOpts } from './swagger-opts.js'

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

  const { provider, Account, AccountErrors, configuration, localKeySet } =
    await configureOidc(
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
    localKeySet,
    MANAGEMENT_API: MANAGEMENT,
    InteractonsAPI,
    getFederationClients
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
  await app.register(FastifySwagger, swaggerOpts)
  await app.register(Scalar, { routePrefix: '/reference' })
  await app.ready()

  // console.log(
  //   app.printPlugins(),
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
