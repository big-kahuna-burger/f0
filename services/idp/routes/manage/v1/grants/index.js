import * as api from '../../../../db/api.js'

export default async function managementRouter(fastify, opts) {
  fastify.put('/:id', updateGrant) // TODO add schema
  fastify.delete('/:id', deleteGrant)
  fastify.post('/', createGrant) // TODO add schema

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
