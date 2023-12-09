import '../helpers/config.js'
import { promisify } from 'node:util'
import Provider from 'oidc-provider'
import helmet from 'helmet'
import redirectToHttps from './helpers/koa-https-redirect.js'

const { ISSUER, NODE_ENV } = process.env
const prod = NODE_ENV === 'production'

export default configure

async function configure (iss = ISSUER) {
  const { default: configuration } = await import('./support/configuration.js')
  const { default: adapter } = await import('./support/adapter.js')

  const provider = new Provider(iss, { adapter, ...configuration })

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
    provider.use(redirectToHttps)
  }

  return provider
}
