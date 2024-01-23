export default async function (fastify, opts) {
  const api = opts.dbClientForManage
  fastify.get('/', { onRequest: fastify.authenticate }, getConnections)
  fastify.get('/:id', { onRequest: fastify.authenticate }, getConnection)
  fastify.delete('/:id', { onRequest: fastify.authenticate }, deleteConnection)

  async function deleteConnection(request, reply) {
    const { id } = request.params
    return api.deleteConnection(id)
  }

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
