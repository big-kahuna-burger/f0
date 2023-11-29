'use strict'

import { config } from 'dotenv'

import { readFileSync, existsSync } from 'fs'
import path from 'path'

import Fastify from 'fastify'
import middie from '@fastify/middie'
import closeWithGrace from 'close-with-grace'

import { configureOidc } from './oidc/index.js'
import desm from 'desm'
config()

const __dirname = desm(import.meta.url)

let parsedHost

try {
  parsedHost = new URL(process.env.ISSUER)
} catch { }

// console.log({ parsedHost })

const MY_HOST = parsedHost.hostname || 'idp.dev'
const port = parsedHost.port || 3000
const mountPoint = parsedHost.pathname || '/oidc'

const certFile = path.join(__dirname, `${MY_HOST}.pem`)
const keyFile = path.join(__dirname, `${MY_HOST}-key.pem`)

// console.log(MY_HOST)

const localHttps = existsSync(certFile)
  ? {
      key: readFileSync(keyFile),
      cert: readFileSync(certFile),
      ca: readFileSync('/Users/bkb/Library/Application Support/mkcert/rootCA.pem')
    }
  : undefined

const host = localHttps ? `https://${MY_HOST}:${port}` : `http://localhost:${port}`

const app = Fastify({
  logger: true,
  https: localHttps
})

start()

async function start () {
  await app.register(middie)
  const provider = await configureOidc()
  provider.use(prePost)

  const oidcCallback = provider.callback()

  app.use(mountPoint, oidcCallback)

  const appService = await import('./app.js')
  app.register(appService, { oidc: provider })

  // delay is the number of milliseconds for the graceful close to finish
  const closeListeners = closeWithGrace({ delay: process.env.FASTIFY_CLOSE_GRACE_DELAY || 500 }, async function ({ signal, err, manual }) {
    if (err) {
      app.log.error(err)
    }
    await app.close()
  })

  app.addHook('onRoute', (routeOptions) => {
    // console.log(routeOptions)
  })

  app.addHook('onClose', async (instance, done) => {
    closeListeners.uninstall()
    done()
  })

  // Start listening.
  app.listen({
    port,
    listenTextResolver: addr => {
      return `OIDC PROVIDER: listening at ${host}. Check metadata at ${host}${mountPoint?.length > 1 ? mountPoint : ''}/.well-known/openid-configuration`
    }
  }, (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
  })
}

async function prePost (ctx, next) {
  /** pre-processing
   * you may target a specific action here by matching `ctx.path`
   */
  console.log('pre middleware', ctx.method, ctx.path)
  await next()
  /** post-processing
   * since internal route matching was already executed you may target a specific action here
   * checking `ctx.oidc.route`, the unique route names used are
   *
   * `authorization`
   * `backchannel_authentication`
   * `client_delete`
   * `client_update`
   * `client`
   * `code_verification`
   * `cors.device_authorization`
   * `cors.discovery`
   * `cors.introspection`
   * `cors.jwks`
   * `cors.pushed_authorization_request`
   * `cors.revocation`
   * `cors.token`
   * `cors.userinfo`
   * `device_authorization`
   * `device_resume`
   * `discovery`
   * `end_session_confirm`
   * `end_session_success`
   * `end_session`
   * `introspection`
   * `jwks`
   * `pushed_authorization_request`
   * `registration`
   * `resume`
   * `revocation`
   * `token`
   * `userinfo`
   */
  console.log('post middleware', ctx.method, ctx.oidc?.route)
}
