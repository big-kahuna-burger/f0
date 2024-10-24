import middie from '@fastify/middie'
import Fastify from 'fastify'
import { configureOidc } from '../oidc/index.js'
import { getFederationClients } from '../oidc/support/federation.js'
import InteractonsAPI from '../oidc/support/interaction.js'
import { MANAGEMENT } from '../resource-servers/management.js'
const config = {}
const parsedHost = new URL(config?.issuer || process.env.ISSUER)
const { hostname, protocol, port, pathname } = parsedHost
if (pathname === '/') {
  throw new Error(
    'You should provide a path/prefix for the issuer. ' +
    "Can't mount it to root. In env vars ISSUER=https://mydomain.com/oidc"
  )
}

const host = `${protocol}//${hostname}${port ? `:${port}` : ''}${pathname}`
const { provider, Account, AccountErrors, localKeySet } =
  await configureOidc(host)

const transport = {
  target: 'pino-pretty',
  options: {
    colorize: false,
    singleLine: true
  }
}

const logger = {
  msgPrefix: 'api:',
  transport
}
const fastifyOpts = { logger }

export const app = Fastify(fastifyOpts)

await app.register(middie)
app.use(pathname, provider.callback())

const appService = await import('../app.js')

app.register(appService, {
  oidc: provider,
  Account,
  AccountErrors,
  localKeySet,
  MANAGEMENT_API: MANAGEMENT,
  InteractonsAPI,
  getFederationClients
})

export const handler = async (req, res) => {
  await app.ready()
  app.server.emit('request', req, res)
}

export default handler
