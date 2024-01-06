import got from 'got'
import { beforeEach, describe, expect, it } from 'vitest'
import * as helper from '../helper.js'
import { sign } from '../sign.js'

describe('management apis api', () => {
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

  it('should 404 on missing id', async () => {
    const jwt = await sign()
    try {
      await got(`http://localhost:${port}/manage/v1/apis/missing_id`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      })
    } catch ({ response }) {
      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({
        error: 'resource server not found'
      })
    }
  })

  it('should be able to list/create/getById on /apis', async () => {
    const jwt = await sign()
    const response = await got(`http://localhost:${port}/manage/v1/apis`, {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual([])

    const createFn = async (alg = 'HS256') => {
      return await got(`http://localhost:${port}/manage/v1/apis`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`
        },
        json: {
          name: 'foo',
          identifier: `https://foo.${alg.toLowerCase()}`,
          signingAlg: alg
        }
      })
    }
    const createResponse = await createFn()
    expect(createResponse.statusCode).toBe(200)
    const created = JSON.parse(createResponse.body)

    expect(created).toEqual({
      id: expect.any(String),
      name: 'foo',
      identifier: 'https://foo.hs256',
      scopes: [],
      signingAlg: 'HS256',
      signingSecret: expect.any(String)
    })

    const createdRs = await createFn('RS256')
    expect(createdRs.statusCode).toBe(200)
    const createdRsBody = JSON.parse(createdRs.body)
    expect(createdRsBody).toEqual({
      id: expect.any(String),
      name: 'foo',
      identifier: 'https://foo.rs256',
      scopes: [],
      signingAlg: 'RS256'
    })

    const getResp = await got(
      `http://localhost:${port}/manage/v1/apis/${created.id}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    )
    expect(getResp.statusCode).toBe(200)
    expect(JSON.parse(getResp.body)).toEqual(created)

    try {
      await createFn()
    } catch (error) {
      expect(error.response.statusCode).toBe(409)
      expect(JSON.parse(error.response.body)).toEqual(
        {
          error:
            'resource indicator "https://foo.hs256" is already registered with oidc server'
        },
        'should error on duplicate identifier'
      )
    }

    const updateName = await got(
      `http://localhost:${port}/manage/v1/api/${created.id}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${jwt}` },
        json: {
          name: 'heyho',
          ttl: 12345,
          ttlBrowser: 1234,
          allowSkipConsent: false
        }
      }
    )
    expect(updateName.statusCode).toBe(200)
    expect(JSON.parse(updateName.body)).toEqual({
      id: created.id,
      name: 'heyho',
      identifier: 'https://foo.hs256',
      scopes: [],
      signingAlg: 'HS256',
      signingSecret: expect.any(String),
      ttl: 12345,
      ttlBrowser: 1234,
      allowSkipConsent: false
    })

    const addGrant = await got(`http://localhost:${port}/manage/v1/grants`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      json: {
        clientId: 'goodclient',
        identifier: created.identifier
      }
    })
    expect(addGrant.statusCode).toBe(200)
    const grantBody = JSON.parse(addGrant.body)
    expect(grantBody).toEqual({
      id: expect.any(String),
      type: 13,
      payload: {
        clientId: 'goodclient',
        exp: 0,
        iat: expect.any(Number),
        jti: expect.any(String),
        kind: 'Grant',
        resources: {
          [created.identifier]: ''
        }
      }
    })
    // just single grant 409
    try {
      const addGrant = await got(`http://localhost:${port}/manage/v1/grants`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        json: {
          clientId: 'goodclient',
          identifier: created.identifier
        }
      })
      expect(addGrant.statusCode).toBe(200)
    } catch (error) {
      expect(JSON.parse(error.response.body)).toEqual({
        error: 'grant already exists'
      })
      expect(error.response.statusCode).toBe(409)
    }

    // update grant with new scopes

    const updateGrant = await got(
      `http://localhost:${port}/manage/v1/grants/${grantBody.id}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${jwt}` },
        json: {
          identifier: created.identifier,
          scopes: ['gets', 'filtered']
        }
      }
    )
    const updatedGrantBody = JSON.parse(updateGrant.body)
    expect(updatedGrantBody).toEqual({
      id: grantBody.id,
      type: 13,
      payload: {
        clientId: 'goodclient',
        exp: 0,
        iat: expect.any(Number),
        jti: grantBody.id,
        kind: 'Grant',
        resources: {
          [created.identifier]: '' // no scopes, gets filtered
        }
      }
    })

    const deleteGrant = await got(
      `http://localhost:${port}/manage/v1/grants/${grantBody.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` }
      }
    )
  })
})
