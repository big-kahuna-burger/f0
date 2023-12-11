'use strict'
import openTelemetryPlugin from '@autotelic/fastify-opentelemetry'

import fp from 'fastify-plugin'

const fpOpts = { fastify: '^4.x' }

export default fp(plugin, fpOpts)

async function plugin (fastify) {
  fastify.register(openTelemetryPlugin, { wrapRoutes: true })
}
