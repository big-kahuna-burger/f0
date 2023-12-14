import * as dotenv from 'dotenv'
dotenv.config()

import Fastify from 'fastify'
import { configureOidc } from '../oidc/index.js'

const app = Fastify({
  logger: true
})

const appService = await import('../app.js')

app.register(appService, {
  oidc: await configureOidc(),
  otel: { wrapRoutes: true }
})

export default async (req, res) => {
  await app.ready()
  app.server.emit('request', req, res)
}
