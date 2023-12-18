import { trace } from '@opentelemetry/api'
import { createLocalJWKSet } from 'jose'
import koaPino from 'koa-pino-logger'
import Provider from 'oidc-provider'
import '../env.js'
import redirectToHttps from './helpers/koa-https-redirect.js'
import staticConfig from './support/configuration.js'
import { calculateKid } from './support/keystore.js'

const tracer = trace.getTracer('oidc-provider')

const { ISSUER } = process.env

export default configure

const JWK_PRIVATE_PROPS = new Set(['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth'])

async function configure(iss, adapterArg) {
  const { default: Account, errors } = await import('./support/account.js')
  const { default: dynamicConf } = await import('./support/dynamic-config.js')
  const adapter = adapterArg || (await import('./support/adapter.js')).default
  const { protocol } = new URL(ISSUER)
  const secureContextRequired = protocol === 'https:'

  const publicJwksNoKid = dynamicConf.jwks.map(key => {
    return Object.entries(key).reduce((acc, [k, v]) => {
      if (!JWK_PRIVATE_PROPS.has(k)) {
        acc[k] = v
      }
      return acc
    }, {})
  })

  const publicKeys = publicJwksNoKid.map(key => ({ ...key, kid: key.kid ? key.kid : calculateKid(key) }))

  const localSet = await createLocalJWKSet({ keys: publicKeys })
  
  const configuration = {
    ...staticConfig,
    jwks: { keys: dynamicConf.jwks },
    cookies: { ...staticConfig.cookies, keys: dynamicConf.cookieKeys },
    findAccount: Account.findAccount,
    publicJwks: localSet
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
