'use strict'

// Read the .env file.
require('dotenv').config()

const path = require('path')
const { existsSync, readFileSync } = require('fs')
// Require the framework
const Fastify = require('fastify')

// Require library to exit fastify process, gracefully (if possible)
const closeWithGrace = require('close-with-grace')

const port = process.env.PORT || 3002
const MY_HOST = `manage.idp.dev`

const certFile = path.join(__dirname, `${MY_HOST}.pem`)
const keyFile = path.join(__dirname, `${MY_HOST}-key.pem`)

const https = existsSync(certFile) ? {
  key: readFileSync(keyFile),
  cert: readFileSync(certFile)
} : undefined

const host = https ? `https://${MY_HOST}:${port}` : `http://localhost:${port}`
// Instantiate Fastify with some config
const app = Fastify({
  logger: true,
  https
})

// Register your application as a normal plugin.
const appService = require('./app.js')
app.register(appService)

// delay is the number of milliseconds for the graceful close to finish
const closeListeners = closeWithGrace({ delay: process.env.FASTIFY_CLOSE_GRACE_DELAY || 500 }, async function ({ signal, err, manual }) {
  if (err) {
    app.log.error({ err })
  }
  await app.close()
})

app.addHook('onClose', async (instance, done) => {
  closeListeners.uninstall()
  done()
})

// Start listening.
app.listen({
  port,
  listenTextResolver: addr => {
  return `Management Dashboard at ${host}`
}}, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
