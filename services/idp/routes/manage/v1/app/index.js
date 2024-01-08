import { clientXMap } from '../../../../db/mappers/client.js'
import { F0_TYPE_PROP } from '../../../../oidc/client-based-cors/index.js'
import {
  updateClientConnectionSchema,
  updateClientSchema
} from '../../../../passive-plugins/manage-validators.js'

export default async function (fastify, opts) {
  const api = opts.dbClientForManage
  fastify.get('/:id', { onRequest: fastify.authenticate }, getClient)
  fastify.put(
    '/:id',
    { onRequest: fastify.authenticate, schema: { body: updateClientSchema } },
    updateClient
  )
  fastify.post('/:id/secret', { onRequest: fastify.authenticate }, rotateSecret)
  fastify.delete('/:id', { onRequest: fastify.authenticate }, deleteClient)
  fastify.put(
    '/:id/connection/:connectionId/:action',
    {
      onRequest: fastify.authenticate,
      schema: { params: updateClientConnectionSchema }
    },
    updateApplicationConnection
  )

  fastify.get(
    '/:id/grants',
    { onRequest: fastify.authenticate },
    getClientGrants
  )

  async function getClientGrants(request, reply) {
    const { id } = request.params
    const grants = await api.getClientGrantsByClientId(id)
    return grants
  }

  async function updateApplicationConnection(request, reply) {
    const { id, connectionId, action } = request.params
    const client = await api.getClient(id)
    if (!client) {
      return reply.code(404).send({ error: 'client not found' })
    }

    const connection = await api.getConnection(connectionId)
    if (!connection) {
      return reply.code(404).send({ error: 'connection not found' })
    }

    if (action === 'enable') {
      return api.addConnectionToClient(id, connectionId)
    }

    if (action === 'disable') {
      return api.removeConnectionFromClient(id, connectionId)
    }

    throw new Error(`unknown action ${action}`)
  }

  async function deleteClient(request, reply) {
    const { id } = request.params
    return api.deleteClient(id)
  }

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
      post_logout_redirect_uris: postLogoutRedirectUris,
      token_endpoint_auth_method: tokenEndpointAuthMethod,
      grant_types: grantTypes,
      rotate_secret: rotateSecret,
      private_key_jwt_credentials: privateKeyJwtCredentials
    } = body

    const [err, result] = await api.updateClient(id, {
      type,
      logoUri,
      clientName,
      grantTypes,
      rotateSecret,
      redirectUris,
      initiateLoginUri,
      postLogoutRedirectUris,
      tokenEndpointAuthMethod,
      privateKeyJwtCredentials
    })
    if (err) {
      reply.code(err.code).send({ error: err.message })
      return
    }
    return result
  }
}
