import Prisma from '@prisma/client'
import * as api from '../../../../db/api.js'
import { resourceServerMap } from '../../../../db/mappers/account.js'
import { apiCreateSchema } from '../../../../passive-plugins/manage-validators.js'

export default async function (fastify, opts) {
  fastify.post(
    '/create',
    { schema: { body: apiCreateSchema } },
    createResourceServer
  )
  fastify.get('/:id', getResourceServer)
  fastify.get('/', getAllResourceServers)

  async function getAllResourceServers() {
    const resourceServers = await api.getResourceServers({
      sort: 'desc'
    })
    return resourceServers
      .map(resourceServerMap)
      .sort((a, b) => (a.id === 'management' ? -1 : 1))
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
