import Fastify from 'fastify'
import { expect, test } from 'vitest'
import OIDC from '../../plugins/oidc-decorator.js'

test('decorator throws when no option is given', async (t) => {
  const fastify = Fastify()
  expect(fastify.register(OIDC, {})).rejects.toThrowError(
    /expected a configured oidc provider to be able to decorate fastify instance/
  )
})

test('decorator works standalone', async (t) => {
  const fastify = Fastify()
  await fastify.register(OIDC, { oidc: {} })
})
