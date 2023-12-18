import http from 'http'
import got from 'got'
import { beforeEach, expect, test, vi } from 'vitest'
import prisma from '../../db/__mocks__/client.js'
import '../../env.js'
import { setupPrisma } from '../tests.dbmock.js'

vi.mock('../../db/client.js')

let sls
let server
const port = 9876

beforeEach(async () => {
  await setupPrisma(prisma)
  const { default: handler, app } = await import('../../api/serverless.js')
  sls = handler
  return async () => {
    await app.close()
    server.close()
  }
})

test('/jwks is working', async (t) => {
  server = http.createServer(async (req, res) => {
    await sls(req, res)
  }).listen(port)

  const { statusCode, headers } = await got(
    `http://localhost:${port}/oidc/jwks`
  )

  expect(statusCode).toEqual(200)
  expect(headers['content-type']).toEqual(
    'application/jwk-set+json; charset=utf-8'
  )
})
