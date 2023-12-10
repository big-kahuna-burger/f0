import { test, beforeEach, expect } from 'vitest'
import got from 'got'

import { build } from '../helper.js'
process.env.OTEL = true
let fastify
let port

beforeEach(async () => {
  // called once before each test run
  fastify = await build()
  await fastify.ready()
  await fastify.listen()
  port = fastify.server.address().port

  // clean up function, called once after each test run
  return async () => {
    await fastify.close()
  }
})

test('will load OTEL', async (t) => {
  await got(`http://localhost:${port}/`)
    .catch(err => expect(err.response.statusCode).toEqual(404))
})
