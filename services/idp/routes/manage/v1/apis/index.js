import Prisma from '@prisma/client'
import * as api from '../../../../db/api.js'
import { resourceServerMap } from '../../../../db/mappers/account.js'
import {
  apiCreateSchema,
  queryApisSchema
} from '../../../../passive-plugins/manage-validators.js'

export default async function (fastify, opts) {
  const fAuth = { onRequest: fastify.authenticate }
  fastify.post(
    '/create',
    { onRequest: fAuth.onRequest, schema: { body: apiCreateSchema } },
    createResourceServer
  )
  fastify.get('/:id', fAuth, getResourceServer)
  fastify.get(
    '/',
    {
      schema: { query: queryApisSchema }
    },
    getAllResourceServers
  )

  async function getAllResourceServers(request, reply) {
    const { page, size } = request.query
    const { resourceServers, total } = await api.getResourceServers({
      page,
      size,
      sort: 'desc'
    })
    reply.header('x-total-count', total)
    return resourceServers
  }

  async function getResourceServer(request, reply) {
    const { id } = request.params

    const resourceServer = await api.getResourceServer(id)
    if (!resourceServer) {
      return reply.code(404).send({ error: 'resource server not found' })
    }
    return resourceServerMap(resourceServer)
  }

  async function createResourceServer(request, reply) {
    const { name, identifier, signingAlg } = request.body || {}
    try {
      const resourceServer = await api.createResourceServer({
        name,
        identifier,
        signingAlg
      })

      return resourceServerMap(resourceServer)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          return reply.code(409).send({
            error: `resource indicator "${identifier}" is already registered with oidc server`
          })
        }
      }
      throw e
    }
  }
}
