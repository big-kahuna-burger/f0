'use strict'

import path from 'node:path'
import AutoLoad from '@fastify/autoload'
import desm from 'desm'
// Pass --options via CLI arguments in command to enable these options.
export const options = {}

const __dirname = desm(import.meta.url)

export default async function (fastify, opts) {
  // Place here your custom code!
  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // console.log(opts, options)
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
