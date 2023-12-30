import * as api from '../../../../db/api.js'
import { allowedClientFields } from '../../../../helpers/validation-constants.js'
import { DEFAULT_CLIENT_INCLUDE } from '../../../../helpers/validation-constants.js'
import { createClientSchema } from '../../../../passive-plugins/manage-validators.js'

import { clientXMap } from '../../../../db/mappers/client.js'

export default async function managementRouter(fastify, opts) {
  fastify.post('/', { schema: { body: createClientSchema } }, createClient)
  fastify.get('/', getAllClients)

  async function createClient(request, reply) {
    const { name, type = '' } = request.body || {}

    return api.createClient({ name, type: type.toLowerCase() })
  }

  async function getAllClients(request) {
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

    const clients = await api.loadClients({
      page,
      size,
      grant_types_include,
      include,
      token_endpoint_auth_method_not
    })

    const payloads = clients.map((x) => clientXMap(x, fields))

    return payloads
  }
}
