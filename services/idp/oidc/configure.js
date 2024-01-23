import koaPino from 'koa-pino-logger'
import Provider from 'oidc-provider'
import '../env.js'
import subscribe from './events.js'
import { calculateJwks } from './helpers/keystore.js'
import redirectToHttps from './helpers/koa-https-redirect.js'
import configureKoaOtel from './helpers/koa-otel.js'
import staticConfig from './support/configuration.js'

export default configure

async function configure(iss, adapterArg) {
  const { default: Account, errors } = await import('./support/account.js')
  const { default: dynamicConf } = await import('./support/dynamic-config.js')
  const adapter = adapterArg || (await import('./support/adapter.js')).default
  const { ISSUER } = process.env
  const { protocol } = new URL(ISSUER)
  const secureContextRequired = protocol === 'https:'

  const localKeySet = await calculateJwks(dynamicConf.jwks)
  const configuration = {
    ...staticConfig,
    jwks: { keys: dynamicConf.jwks },
    cookies: { ...staticConfig.cookies, keys: dynamicConf.cookieKeys },
    findAccount: Account.findAccount
  }

  const provider = new Provider(iss || ISSUER, { adapter, ...configuration })

  subscribe(provider)
  if (secureContextRequired) {
    provider.use(koaPino())
    provider.proxy = true
    provider.use(redirectToHttps)
  }

  configureKoaOtel(provider)

  return {
    provider,
    localKeySet,
    configuration,
    Account,
    AccountErrors: errors
  }
}
