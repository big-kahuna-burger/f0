import * as api from '../../../../db/api.js'

export default async function (fastify, opts) {
  const fAuth = { onRequest: fastify.authenticate }
  fastify.put('/:id', fAuth, updateGrant) // TODO add schema
  fastify.delete('/:id', fAuth, deleteGrant)
  fastify.post('/', fAuth, createGrant) // TODO add schema

  async function updateGrant(request, reply) {
    const {
      body: { scopes, identifier },
      params: { id }
    } = request
    const grantUpdated = await api.updateScopesForIdentifier(
      id,
      scopes,
      identifier
    )
    return grantUpdated
  }

  async function deleteGrant(request, reply) {
    const { id } = request.params
    const grantDeleted = await api.deleteGrant(id)
    return grantDeleted
  }

  async function createGrant(request, reply) {
    const { clientId, identifier } = request.body || {}
    const grantCreated = await api.createGrant({
      clientId,
      identifier,
      scope: ''
    })
    return grantCreated
  }
}
