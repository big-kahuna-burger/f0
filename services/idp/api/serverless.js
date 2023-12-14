import * as dotenv from 'dotenv'
dotenv.config()
import middie from '@fastify/middie'
import Fastify from 'fastify'
import { configureOidc } from '../oidc/index.js'
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
const provider = await configureOidc(host)

const transport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    singleLine: true
  }
}

const logger = {
  msgPrefix: '[f0]: ',
  transport
}
const fastifyOpts = { logger }

const app = Fastify(fastifyOpts)

await app.register(middie)
app.use(pathname, provider.callback())
const appService = await import('../app.js')
app.register(appService, {
  oidc: provider
})

export default async (req, res) => {
  await app.ready()
  app.server.emit('request', req, res)
}