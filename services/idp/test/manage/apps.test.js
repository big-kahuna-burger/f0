import exp from 'constants'
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

  it('should 404 on missing id', async () => {
    const jwt = await sign()
    try {
      await got(`http://localhost:${port}/manage/v1/app/missing_id`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      })
    } catch ({ response }) {
      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({
        error: 'client not found'
      })
    }
  })

  it('should be able to list/create/getById on /apps', async () => {
    const jwt = await sign()
    const url = `http://localhost:${port}/manage/v1/apps`
    const response = await got(url, {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual([
      {
        client_id: 'goodclient',
        grant_types: ['authorization_code'],
        logo_uri: 'https://somerp.com/logo.png',
        post_logout_redirect_uris: [],
        readonly: true, //this is the difference but ok for now
        redirect_uris: ['https://somerp.com/cb'],
        token_endpoint_auth_method: 'none',

      }
    ])

    const createFn = async () => {
      return await got(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`
        },
        json: {
          name: 'foo',
          'urn:f0:type': 'spa'
        }
      })
    }
    const createResponse = await createFn()
    expect(createResponse.statusCode).toBe(201)
    const created = JSON.parse(createResponse.body)
    expect(created).toEqual({
      application_type: 'native',
      client_id: expect.any(String),
      client_name: 'foo',
      client_id_issued_at: expect.any(Number),
      client_secret: expect.any(String),
      client_secret_expires_at: 0,
      dpop_bound_access_tokens: false,
      grant_types: ['authorization_code', 'refresh_token'],
      subject_type: 'public',
      redirect_uris: [],
      response_types: ['code'],
      post_logout_redirect_uris: [],
      token_endpoint_auth_method: 'none',
      id_token_signed_response_alg: 'RS256',
      require_auth_time: false,
      require_pushed_authorization_requests: false,
      'urn:f0:type': 'spa'
    })

    const getResp = await got(
      `http://localhost:${port}/manage/v1/app/${created.client_id}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    )
    expect(getResp.statusCode).toBe(200)
    const applicationResponse = JSON.parse(getResp.body)
    expect(applicationResponse).toEqual({
      application_type: 'native',
      client_id: expect.any(String),
      client_name: 'foo',
      client_secret: expect.any(String),
      grant_types: ['authorization_code', 'refresh_token'],
      post_logout_redirect_uris: [],
      redirect_uris: [],
      token_endpoint_auth_method: 'none',
      'urn:f0:type': 'spa',
      response_types: ['code']
    })

    const updateName = await got(
      `http://localhost:${port}/manage/v1/app/${created.client_id}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${jwt}` },
        json: {
          client_name: 'heyhoapp'
        }
      }
    )
    expect(updateName.statusCode).toBe(200)
    const updated = JSON.parse(updateName.body)

    const { id, payload, readonly } = updated

    expect(id).toEqual(created.client_id)
    expect(payload.client_name).toEqual('heyhoapp')
    expect(readonly).toEqual(false)
    expect(payload.post_logout_redirect_uris).toEqual([])
    expect(payload.redirect_uris).toEqual([])
    expect(payload.token_endpoint_auth_method).toEqual('none')
    expect(payload['urn:f0:type']).toEqual('spa')
    expect(payload.application_type).toEqual('native')
    expect(payload.client_id_issued_at).toEqual(expect.any(Number))
    expect(payload.client_secret_expires_at).toEqual(0)
    expect(payload.dpop_bound_access_tokens).toEqual(false)
    expect(payload.grant_types).toEqual(['authorization_code', 'refresh_token'])
    expect(payload.subject_type).toEqual('public')
    expect(payload.response_types).toEqual(['code'])
    expect(payload.id_token_signed_response_alg).toEqual('RS256')
    expect(payload.require_auth_time).toEqual(false)
    expect(payload.require_pushed_authorization_requests).toEqual(false)
    expect(payload.client_secret).toEqual(expect.any(String))

    //cant update missing client
    try {
      await got(`http://localhost:${port}/manage/v1/app/missing_id`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${jwt}` },
        json: {
          client_name: 'heyhoapp'
        }
      })
    } catch (error) {
      expect(error.response.statusCode).toBe(404)
      expect(JSON.parse(error.response.body)).toEqual({
        error: 'client not found'
      })
    }

    //cant update readonly client
    try {
      await got(`http://localhost:${port}/manage/v1/app/goodclient`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${jwt}` },
        json: {
          client_name: 'heyhoapp'
        }
      })
    } catch (error) {
      expect(error.response.statusCode).toBe(403)
      expect(JSON.parse(error.response.body)).toEqual({
        error: 'client is readonly'
      })
    }
  })
})
