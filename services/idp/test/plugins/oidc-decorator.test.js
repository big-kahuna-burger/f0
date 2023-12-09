import { test } from 'tap'
import Fastify from 'fastify'
import OIDC from '../../plugins/oidc-decorator.js'

test('decorator throws when no option is given', async (t) => {
  const fastify = Fastify()
  try {
    await fastify.register(OIDC, {})
  } catch (error) {
    t.equal(error.message, 'expected a configured oidc provider to be able to decorate fastify instance') 
  }
})

test('decorator works standalone', async (t) => {
  const fastify = Fastify()
  t.doesNotThrow(async () => {
    await fastify.register(OIDC, { oidc: {} })
  })
})
