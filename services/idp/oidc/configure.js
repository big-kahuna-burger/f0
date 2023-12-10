import '../helpers/config.js'
import { promisify } from 'node:util'
import Provider from 'oidc-provider'
import helmet from 'helmet'
import redirectToHttps from './helpers/koa-https-redirect.js'

import koaPino from 'koa-pino-logger'
const { ISSUER, NODE_ENV } = process.env
const prod = NODE_ENV === 'production'

export default configure

async function configure (iss, adapterArg) {
  const { default: configuration } = await import('./support/configuration.js')

  const adapter = adapterArg || (await import('./support/adapter.js')).default
  const provider = new Provider(iss || ISSUER, { adapter, ...configuration })
  // TODO move this to pino
  // provider.on('authorization.error', console.log)

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
    // ctx.req.secure = ctx.request.secure // TODO check what to do here
    await pHelmet(ctx.req, ctx.res)
    // ctx.req.secure = origSecure
    return next()
  })
  // provider.use(koaPino({
  //   transport: {
  //     target: 'pino-pretty',
  //     options: {
  //       colorize: true
  //     }
  //   }
  // }))
  // provider.use(async (ctx, next) => {
  //   try {
  //     await next();
  //   } catch (err) {
  //     // will only respond with JSON
  //     ctx.status = err.statusCode || err.status || 500;
  //     ctx.body = {
  //       message: err.stack
  //     };
  //   }
  // })
  if (prod) {
    provider.proxy = true
    provider.use(redirectToHttps)
  }

  return provider
}
