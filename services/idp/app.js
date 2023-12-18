import path from 'node:path'
import AutoLoad from '@fastify/autoload'
import Cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import Static from '@fastify/static'
import View from '@fastify/view'
import desm from 'desm'
import ejs from 'ejs'
// Pass --options via CLI arguments in command to enable these options.
export const options = {}

const __dirname = desm(import.meta.url)

export default async function runme(fastify, opts) {
  await fastify.register(Cors, {
    origin: 'http://localhost:3036'
  })

  fastify.register(helmet, {
    enableCSPNonces: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://unpkg.com'],
        formAction: null,
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrcAttr: ["'self'", "'unsafe-inline'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    }
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
      showDebug: opts.grantsDebug
    }
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  })
}
