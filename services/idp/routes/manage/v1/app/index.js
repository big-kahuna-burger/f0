import * as api from '../../../../db/api.js'
import { clientXMap } from '../../../../db/mappers/client.js'
import { F0_TYPE_PROP } from '../../../../oidc/client-based-cors/index.js'
import { updateClientSchema } from '../../../../passive-plugins/manage-validators.js'

export default async function (fastify, opts) {
  const fAuth = { onRequest: fastify.authenticate }
  fastify.get('/:id', fAuth, getClient)
  fastify.put(
    '/:id',
    { onRequest: fAuth.onRequest, schema: { body: updateClientSchema } },
    updateClient
  )
  fastify.post('/:id/secret', fAuth, rotateSecret)

  async function rotateSecret(request, reply) {
    throw new Error(
      'not implemented yet. Open issue with https://github.com/big-kahuna-burger/f0/issues/new'
    )
  }

  async function getClient(request, reply) {
    const { id } = request.params
    const client = await api.getClient(id)
    if (!client) {
      return reply.code(404).send({ error: 'client not found' })
    }

    return clientXMap(client)
  }

  async function updateClient(request, reply) {
    const {
      params: { id, ...params },
      body = {}
    } = request

    const {
      [F0_TYPE_PROP]: type,
      logo_uri: logoUri,
      client_name: clientName,
      initiate_login_uri: initiateLoginUri,
      redirect_uris: redirectUris,
      post_logout_redirect_uris: postLogoutRedirectUris
    } = body

    return api.updateClient(id, {
      type,
      logoUri,
      clientName,
      initiateLoginUri,
      redirectUris: [...new Set(redirectUris)],
      postLogoutRedirectUris: [...new Set(postLogoutRedirectUris)]
    })
  }
}
