import {
  createConnectionSchema,
  updateConnectionSchema
} from '../../../../passive-plugins/manage-validators.js'

export default async function (fastify, opts) {
  const api = opts.dbClientForManage
  fastify.get('/', { onRequest: fastify.authenticate }, getConnections)
  fastify.get('/:id', { onRequest: fastify.authenticate }, getConnection)
  fastify.delete('/:id', { onRequest: fastify.authenticate }, deleteConnection)
  fastify.post(
    '/',
    {
      onRequest: fastify.authenticate,
      schema: { body: createConnectionSchema }
    },
    createDBConnection
  )
  fastify.patch(
    '/:id',
    {
      onRequest: fastify.authenticate,
      schema: {
        body: updateConnectionSchema
      }
    },
    updateConnection
  )

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

  async function createDBConnection(request, reply) {
    const { name, disableSignup } = request.body
    const error = validateConnectionName(name)
    if (error) {
      return reply.code(400).send({ error })
    }
    const connection = await api.createDBConnection({ name, disableSignup })
    return connection
  }

  async function updateConnection(request, reply) {
    const { id } = request.params
    const { disableSignup } = request.body
    const connection = await api.updateDBConnection(id, { disableSignup })
    return connection
  }
}

const validateConnectionName = (value) => {
  if (!/^[a-zA-Z0-9]/.test(value)) {
    return 'Must start with an alphanumeric character'
  }
  if (!/^[a-zA-Z0-9-]{0,35}$/.test(value)) {
    return 'Can only contain alphanumeric characters and -'
  }
  if (!/[a-zA-Z0-9]$/.test(value)) {
    return 'Must end with an alphanumeric character'
  }
}
