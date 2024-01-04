import * as api from '../../../../db/api.js'

export default async function (fastify, opts) {
  fastify.get('/', { onRequest: fastify.authenticate }, getConnections)
  fastify.get('/:id', { onRequest: fastify.authenticate }, getConnection)

  async function getConnections(request, reply) {
    const {
      query: { type }
    } = request
    const connections = await api.getConnections({ type })
    return connections
  }

  async function getConnection(request, reply) {
    const { id } = request.params

    const connection = await api.getConnection(id)
    if (!connection) {
      return reply.code(404).send({ error: 'connection not found' })
    }
    return connection
  }
}
