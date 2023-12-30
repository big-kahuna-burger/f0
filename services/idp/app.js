import path from 'node:path'
import AutoLoad from '@fastify/autoload'
import Cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import Static from '@fastify/static'
import View from '@fastify/view'
import desm from 'desm'
import ejs from 'ejs'
import CSP from './csp.js'
// Pass --options via CLI arguments in command to enable these options.
export const options = {}

const __dirname = desm(import.meta.url)

export default async function runme(fastify, opts) {
  await fastify.register(Cors, {
    origin: '*'
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
    options: Object.assign({}, { maxDepth: 3 }, opts)
  })
}
