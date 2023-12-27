import * as api from '../../../db/api.js'
import { accountMAP, resourceServerMap } from '../../../db/mappers/account.js'
import { allowedClientFields } from '../../../helpers/validation-constants.js'
import joseVerify from '../../../passive-plugins/jwt-jose.js'
const ACCEPTED_ALGORITHMS = ['ES256', 'RS256']
import Prisma from '@prisma/client'
const DEFAULT_CLIENT_INCLUDE =
  'client_id,client_name,client_secret,application_type,client_uri,initial_login_uri,logo_uri,grant_types,token_endpoint_auth_method,redirect_uris,post_logout_redirect_uris,initiate_login_uri,urn:f0:type,updatedAt'
export default async function managementRouter(fastify, opts) {
  const MANAGEMENT = opts.MANAGEMENT_API
  fastify.register(joseVerify, {
    secret: opts.localKeySet,
    options: {
      issuer: process.env.ISSUER,
      algorithms: ACCEPTED_ALGORITHMS,
      audience: MANAGEMENT.identifier
    }
  })

  // set error handler and inherit unauthorized error handling it with 401 from here

  fastify.addHook('onRequest', async function onRequest(request, reply) {
    try {
      await request.jwtVerify()
    } catch (error) {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  // produce some management API audit logs based on user/action taken

  fastify.get('/users/:id', getUser)
  fastify.get('/users', getUsers)
  fastify.post('/apis/create', createResourceServer)
  fastify.get('/apis/:id', getResourceServer)
  fastify.put('/api/:id/scopes', updateScopes)
  fastify.put('/api/:id', updateApi)
  fastify.get('/api/:id/grants', getGrantsByResourceServerId)
  fastify.post('/grants/create', createGrant)
  fastify.put('/grants/:id', updateGrant)
  fastify.delete('/grants/:id', deleteGrant)
  fastify.get('/apis', getAllResourceServers)
  fastify.get('/app/:id', getClient)
  fastify.post('/apps', createClient)
  fastify.get('/apps', getAllClients)

  const clientXMap = (x, fields) =>
    Object.fromEntries(fields.map((f) => [f, x[f] || x.payload[f]]))

  async function getClient(request, reply) {
    const { id } = request.params
    const client = await api.getClient(id)
    if (!client) {
      return reply.code(404).send({ error: 'client not found' })
    }

    return clientXMap(client, DEFAULT_CLIENT_INCLUDE.split(','))
  }

  async function createClient(request, reply) {
    const { name, type = '' } = request.body || {}
    return api.createClient({ name, type: type.toLowerCase() })
  }

  async function getAllClients(request) {
    const {
      page = 1,
      size = 20,
      grant_types_include,
      include = DEFAULT_CLIENT_INCLUDE,
      token_endpoint_auth_method_not
    } = request.query
    const fields = include?.length ? include.split(',') : []
    if (!fields.every((f) => allowedClientFields.includes(f))) {
      throw new Error('invalid fields found in include query param')
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

  async function getUser(request) {
    const account = await api.getAccount(request.params.id)
    return accountMAP(account)
  }

  async function getUsers(request) {
    const { page = 1, size = 20 } = request.query

    const accounts = await api.loadAccounts({ page, size })
    return accounts.map(accountMAP)
  }

  async function getAllResourceServers() {
    const resourceServers = await api.getResourceServers({
      sort: 'desc'
    })
    return resourceServers
      .map(resourceServerMap)
      .sort((a, b) => (a.id === 'management' ? -1 : 1))
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
  async function getResourceServer(request, reply) {
    const { id } = request.params

    const resourceServer = await api.getResourceServer(id)
    if (!resourceServer) {
      return reply.code(404).send({ error: 'resource server not found' })
    }
    return resourceServerMap(resourceServer)
  }

  async function createResourceServer(request, reply) {
    const { name, identifier, signingAlg } = request.body || {}
    try {
      const resourceServer = await api.createResourceServer({
        name,
        identifier,
        signingAlg
      })

      return resourceServerMap(resourceServer)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          return reply.code(409).send({
            error: `resource indicator "${identifier}" is already registered with oidc server`
          })
        }
      }
      throw e
    }
  }

  async function createGrant(request, reply) {
    const { clientId, identifier } = request.body || {}
    console.log(JSON.stringify({ clientId, identifier }, null, 2))
    const grantCreated = await api.createGrant({
      clientId,
      identifier,
      scope: ''
    })
    return grantCreated
  }
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
  async function updateScopes(request, reply) {
    const { id } = request.params
    const { add, remove } = request.body
    const rs = await api.updateResourceServerScopes(id, add, remove)
    return rs
  }

  async function updateApi(request, reply) {
    const { id } = request.params
    const { name, ttl, ttlBrowser, allowSkipConsent } = request.body
    const rs = await api.updateResourceServer(id, {
      name,
      ttl,
      ttlBrowser,
      allowSkipConsent
    })
    return rs
  }
}
