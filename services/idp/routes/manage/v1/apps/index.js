import * as api from '../../../../db/api.js'
import { clientXMap } from '../../../../db/mappers/client.js'
import { allowedClientFields } from '../../../../helpers/validation-constants.js'
import { DEFAULT_CLIENT_INCLUDE } from '../../../../helpers/validation-constants.js'
import { F0_TYPE_PROP } from '../../../../oidc/client-based-cors/index.js'
import {
  createClientSchema,
  queryClientSchema
} from '../../../../passive-plugins/manage-validators.js'

const responseFields = [
  'client_id',
  'client_name',
  'application_type',
  'grant_types',
  'logo_uri',
  'token_endpoint_auth_method',
  'redirect_uris',
  'post_logout_redirect_uris',
  'urn:f0:type',
  'updatedAt',
  'readonly'
]

export default async function (fastify, opts) {
  fastify.post(
    '/',
    { onRequest: fastify.authenticate, schema: { body: createClientSchema } },
    createClient
  )
  fastify.get(
    '/',
    { onRequest: fastify.authenticate, schema: { query: queryClientSchema } },
    getAllClients
  )

  async function createClient(request, reply) {
    const { name } = request.body || {}
    const type = request.body[F0_TYPE_PROP]
    const created = await api.createClient({ name, type: type.toLowerCase() })
    reply.code(201).send(created)
  }

  async function getAllClients(request, reply) {
    const {
      page = 1,
      size = 20,
      grant_types_include,
      include,
      token_endpoint_auth_method_not
    } = request.query
    const fields = include?.length ? include.split(',') : DEFAULT_CLIENT_INCLUDE

    if (!fields.every((f) => allowedClientFields.includes(f))) {
      throw new Error('found dissalowed field in include query param')
    }

    const { clients, total } = await api.loadClients({
      page,
      size,
      grant_types_include,
      include,
      token_endpoint_auth_method_not
    })

    const payloads = clients.map((x) => clientXMap(x, responseFields))
    reply.header('x-total-count', total)
    return payloads
  }
}
