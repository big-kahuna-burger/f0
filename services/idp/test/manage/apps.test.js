import got from 'got'
import { beforeEach, describe, expect, it } from 'vitest'
import * as helper from '../helper.js'
import { sign } from '../sign.js'

describe('management apps api', () => {
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
      await got(`http://localhost:${port}/manage/v1/apis`, {
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
  

  it('should be able to list apis', async () => {
    const jwt = await sign()
    const response = await got(`http://localhost:${port}/manage/v1/apis`, {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual([])
  })
})
