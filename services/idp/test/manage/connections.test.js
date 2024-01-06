import got from 'got'
import { beforeEach, describe, expect, it } from 'vitest'
import * as helper from '../helper.js'
import { sign } from '../sign.js'

describe('management connections api', () => {
  let fastify
  let port
  beforeEach(async () => {
    // called once before each test run
    fastify = await helper.build()
    await fastify.ready()
    await fastify.listen()
    port = fastify.server.address().port

    // clean up function, called once after each test run
    return async () => {
      await fastify.close()
    }
  })

  it('should give 401 with bad token', async () => {
    try {
      const jwt = await sign({ aud: 'bad' })
      await got(`http://localhost:${port}/manage/v1/connections`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      })
    } catch (error) {
      expect(error.response.statusCode).toBe(401)
      expect(JSON.parse(error.response.body)).toEqual({
        error: 'Unauthorized'
      })
    }
  })

  it('should 404 on missing id', async () => {
    const jwt = await sign()
    try {
      await got(`http://localhost:${port}/manage/v1/connections/missing_id`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      })
    } catch ({ response }) {
      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({
        error: 'connection not found'
      })
    }
  })
})
