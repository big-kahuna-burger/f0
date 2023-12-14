import path from 'node:path'
import AutoLoad from '@fastify/autoload'
import helmet from '@fastify/helmet'
import Static from '@fastify/static'
import View from '@fastify/view'
import desm from 'desm'
import ejs from 'ejs'
// Pass --options via CLI arguments in command to enable these options.
export const options = {}

const __dirname = desm(import.meta.url)

export default async function runme(fastify, opts) {
  // Place here your custom code!
  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // console.log(opts, options)
  fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [
          "'self'",
          'https://vitals.vercel-insights.com',
          'https://vitals.vercel-analytics.com'
        ],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
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
      //analyticsId: process.env.VERCEL_ANALYTICS_ID || '',
      uid: '',
      nonce: ''
    }
  })
  // analyticsId: process.env.VERCEL_ANALYTICS_ID || ''
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  })
}
