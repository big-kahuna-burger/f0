import * as api from '../../../../db/api.js'

export default async function (fastify, opts) {
  fastify.get('/', getConnections)
  fastify.get('/:id', getConnection)

  async function getConnections() {
    const connections = await api.getConnections()
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
