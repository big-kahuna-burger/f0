import { trace } from '@opentelemetry/api'
import koaPino from 'koa-pino-logger'
import Provider from 'oidc-provider'
import './helpers/config.js'
import redirectToHttps from './helpers/koa-https-redirect.js'

const tracer = trace.getTracer('oidc-provider')

const { ISSUER, NODE_ENV } = process.env
const prod = NODE_ENV === 'production'

export default configure

async function configure(iss, adapterArg) {
  const { default: configuration } = await import('./support/configuration.js')
  // TODO make this into explicit static vs dynamic loader
  const { default: Account, errors } = await import('./support/account.js')
  configuration.findAccount = Account.findAccount
  const adapter = adapterArg || (await import('./support/adapter.js')).default
  const provider = new Provider(iss || ISSUER, { adapter, ...configuration })

  if (process.env.ENV !== 'test') {
    provider.use(koaPino())
  }

  if (prod) {
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
