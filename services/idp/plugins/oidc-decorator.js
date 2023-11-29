'use strict'

import fp from 'fastify-plugin'

const fpOpts = { fastify: '^4.x' }

export default fp(plugin, fpOpts)

async function plugin (fastify, { oidc }) {
  if (!oidc) {
    throw new Error('expected a configured oidc provider to be able to decorate fastify instance')
  }

  fastify.decorate('oidc', oidc)
}
