import * as api from '../../../../db/api.js'
import {
  createGrantSchema,
  updateGrantSchema
} from '../../../../passive-plugins/manage-validators.js'

export default async function (fastify, opts) {
  fastify.put(
    '/:id',
    { onRequest: fastify.authenticate, schema: { body: updateGrantSchema } },
    updateGrant
  )
  fastify.delete('/:id', { onRequest: fastify.authenticate }, deleteGrant)
  fastify.post(
    '/',
    { onRequest: fastify.authenticate, schema: { body: createGrantSchema } },
    createGrant
  )

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
    const { clientId, identifier, scope = '' } = request.body || {}
    const grantCreated = await api.createGrant({
      clientId,
      identifier,
      scope
    })
    return grantCreated
  }
}
