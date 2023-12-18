import http from 'http'
import got from 'got'
import { expect, test, vi } from 'vitest'
import prisma from '../../db/__mocks__/client.js'
import '../../env.js'
import { setupPrisma } from '../tests.dbmock.js'

vi.mock('../../db/client.js')

test('/jwks is working', async (t) => {
  const port = 9966
  await setupPrisma(prisma)
  const { handler, app } = await import('../../api/serverless.js')
  const server = http.createServer(handler).listen(port)

  const { statusCode, headers } = await got(
    `http://localhost:${port}/oidc/jwks`
  )

  expect(statusCode).toEqual(200)
  expect(headers['content-type']).toEqual(
    'application/jwk-set+json; charset=utf-8'
  )

  await app.close()
  server.close()
})
