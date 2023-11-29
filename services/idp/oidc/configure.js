import path from 'path'
import { promisify } from 'node:util'

import render from '@koa/ejs'
import helmet from 'helmet'
import desm from 'desm'

import configuration from './support/configuration.js'
import routes from './routes/index.js'
import Account from './support/account.js'

const __dirname = desm(import.meta.url)

const { PORT = 3000, ISSUER = `http://localhost:${PORT}` } = process.env

export default configure

async function configure () {
  configuration.findAccount = Account.findAccount
  const { default: Provider } = await import('oidc-provider')

  let adapter
  if (process.env.MONGODB_URI) {
    ({ default: adapter } = await import('./adapters/mongodb.js'))
    await adapter.connect()
  }

  const prod = process.env.NODE_ENV === 'production'

  const provider = new Provider(ISSUER, { adapter, ...configuration })

  const directives = helmet.contentSecurityPolicy.getDefaultDirectives()
  delete directives['form-action']
  const pHelmet = promisify(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives
    }
  }))

  provider.use(async (ctx, next) => {
    const origSecure = ctx.req.secure
    ctx.req.secure = ctx.request.secure
    await pHelmet(ctx.req, ctx.res)
    ctx.req.secure = origSecure
    return next()
  })

  if (prod) {
    provider.proxy = true
    provider.use(async (ctx, next) => {
      if (ctx.secure) {
        await next()
      } else if (ctx.method === 'GET' || ctx.method === 'HEAD') {
        ctx.status = 303
        ctx.redirect(ctx.href.replace(/^http:\/\//i, 'https://'))
      } else {
        ctx.body = {
          error: 'invalid_request',
          error_description: 'do yourself a favor and only use https'
        }
        ctx.status = 400
      }
    })
  }
  render(provider.app, {
    cache: false,
    viewExt: 'ejs',
    layout: '_layout',
    root: path.join(__dirname, 'views')
  })
  const _r = await routes(provider)
  provider.use(_r.routes())
  return provider
}
