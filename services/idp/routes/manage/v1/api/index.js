import {
  updateApiSchema,
  updateScopesSchema
} from '../../../../passive-plugins/manage-validators.js'

export default async function (fastify, opts) {
  const api = opts.dbClientForManage
  fastify.put(
    '/:id/scopes',
    { onRequest: fastify.authenticate, schema: { body: updateScopesSchema } },
    updateScopes
  )
  fastify.put(
    '/:id',
    { onRequest: fastify.authenticate, schema: { body: updateApiSchema } },
    updateApi
  )
  fastify.get(
    '/:id/grants',
    { onRequest: fastify.authenticate },
    getGrantsByResourceServerId
  )
  fastify.delete(
    '/:id',
    { onRequest: fastify.authenticate },
    deleteResourceServer
  )

  async function deleteResourceServer(request, reply) {
    const { id } = request.params
    const rs = await api.getResourceServer(id)
    if (!rs) {
      throw new Error(`resource server not found ${id}`)
    }

    if (rs.readOnly) {
      throw new Error('Cannot delete read only resource server')
    }

    return api.deleteResourceServer(id)
  }

  async function getGrantsByResourceServerId(request) {
    const { page = 1, size = 20 } = request.query
    const { id } = request.params
    const rs = await api.getResourceServer(id)
    if (!rs) {
      throw new Error(`resource server not found ${id}`)
    }

    const grants = await api.loadGrantsByResourceIdentifier({
      page,
      size,
      identifier: rs.identifier
    })
    return grants
  }

  async function updateScopes(request, reply) {
    const { id } = request.params
    const { add, remove } = request.body
    const rs = await api.updateResourceServerScopes(id, add, remove)

    if (rs.readOnly) {
      throw new Error('Cannot update scopes on read only resource server')
    }

    return rs
  }

  async function updateApi(request, reply) {
    const { id } = request.params
    const { name, ttl, ttlBrowser, allowSkipConsent } = request.body
    const rs = await api.updateResourceServer(id, {
      name,
      ttl,
      ttlBrowser,
      allowSkipConsent // TODO interpret on oidc-config side
    })
    return rs
  }
}
