import { trace } from '@opentelemetry/api'
import koaPino from 'koa-pino-logger'
import Provider from 'oidc-provider'
import './helpers/config.js'
import redirectToHttps from './helpers/koa-https-redirect.js'

const tracer = trace.getTracer('oidc-provider')

const { ISSUER } = process.env

export default configure

async function configure(iss, adapterArg) {
  const { default: staticConfig } = await import('./support/configuration.js')
  const { default: Account, errors } = await import('./support/account.js')
  const { default: dynamicConf } = await import('./support/dynamic-config.js')
  const adapter = adapterArg || (await import('./support/adapter.js')).default
  const { protocol } = new URL(ISSUER)
  const secureContextRequired = protocol === 'https:'
  const configuration = {
    ...staticConfig,
    jwks: { keys: dynamicConf.jwks },
    cookies: { ...staticConfig.cookies, keys: dynamicConf.cookieKeys },
    findAccount: Account.findAccount
  }

  const provider = new Provider(iss || ISSUER, { adapter, ...configuration })

  if (process.env.ENV !== 'test') {
    provider.use(koaPino())
  }

  if (secureContextRequired) {
    provider.proxy = true
    provider.use(redirectToHttps)
  }

  if (process.env.OTEL) {
    provider.use(koaActiveSpan) // do this until auto instrumentation starts working
  }

  return { provider, configuration, Account, AccountErrors: errors }
}

async function koaActiveSpan(ctx, next) {
  await tracer.startActiveSpan(`${ctx.method} - ${ctx.path}`, async (span) => {
    await next()
    span.end()
  })
}
