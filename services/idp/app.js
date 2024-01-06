import path from 'node:path'
import AutoLoad from '@fastify/autoload'
import Cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import Static from '@fastify/static'
import View from '@fastify/view'
import desm from 'desm'
import ejs from 'ejs'
import CSP from './csp.js'
import * as dbClientForManage from './db/api.js'
import joseVerify from './passive-plugins/jwt-jose.js'
// Pass --options via CLI arguments in command to enable these options.
export const options = {}

const __dirname = desm(import.meta.url)

export default async function runme(fastify, opts) {
  const ACCEPTED_ALGORITHMS = ['ES256', 'RS256']
  const MANAGEMENT = opts.MANAGEMENT_API
  fastify.register(joseVerify, {
    secret: opts.localKeySet,
    options: {
      issuer: process.env.ISSUER,
      algorithms: ACCEPTED_ALGORITHMS,
      audience: MANAGEMENT.identifier
    }
  })

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (error) {
      fastify.log.error(error)
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  await fastify.register(Cors, {
    exposedHeaders: ['x-total-count'],
    origin: '*' // TODO, client based cors on oidc routes, on manage allow this
  })

  fastify.register(helmet, {
    contentSecurityPolicy: CSP
  })

  fastify.register(Static, {
    root: path.join(__dirname, 'public')
  })

  fastify.register(View, {
    engine: { ejs },
    root: path.join(__dirname, 'ejs-templates'),
    layout: './layout',
    extName: 'ejs',
    defaultContext: {
      uid: '',
      vercel: opts.isVercel,
      showDebug: process.env.GRANTS_DEBUG
    }
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign(
      {
        dbClientForManage
      },
      { maxDepth: 3 },
      opts
    )
  })
}
