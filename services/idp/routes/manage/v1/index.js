import * as api from '../../../db/api.js'
import { accountMAP, resourceServerMap } from '../../../db/mappers/account.js'
import joseVerify from '../../../passive-plugins/jwt-jose.js'

const ACCEPTED_ALGORITHMS = ['ES256', 'RS256']

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
  fastify.get('/apis', getAllResourceServers)

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
    const resourceServers = [MANAGEMENT, ...(await api.getResourceServers())]
    return resourceServers.map(resourceServerMap)
  }

  async function getResourceServer(request, reply) {
    const { id } = request.params
    if (id === MANAGEMENT.id) {
      return resourceServerMap(MANAGEMENT)
    }
    const resourceServer = await api.getResourceServer(id)
    if (!resourceServer) {
      return reply.code(404).send({ error: 'resource server not found' })
    }
    return resourceServerMap(resourceServer)
  }

  async function createResourceServer(request, reply) {
    const { name, identifier, signingAlg } = request.body || {}
    if (identifier === MANAGEMENT.identifier) {
      return reply.code(409).send({ error: 'erm... NOPE' })
    }
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
          return reply
            .code(409)
            .send({
              error: `resource indicator "${identifier}" is already registered with oidc server`
            })
        }
      }
      throw e
    }
  }
}
