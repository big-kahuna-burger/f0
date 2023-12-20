import * as api from '../../../db/api.js'
import { accountMAP, resourceServerMap } from '../../../db/mappers/account.js'
import joseVerify from '../../../passive-plugins/jwt-jose.js'
import { getReadOnlyRServer } from '../../../resource-servers/index.js'

const ACCEPTED_ALGORITHMS = ['ES256', 'RS256']

export default async function managementRouter(fastify, opts) {
  fastify.register(joseVerify, {
    secret: opts.localKeySet,
    options: { algorithms: ACCEPTED_ALGORITHMS }
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
  fastify.get('/apis', getAllResourceServers)

  async function getUser(request, reply) {
    const account = await api.getAccount(request.params.id)
    return accountMAP(account)
  }

  async function getUsers(request, reply) {
    const { page = 1, size = 20 } = request.query

    const accounts = await api.loadAccounts({ page, size })
    return accounts.map(accountMAP)
  }

  async function getAllResourceServers(request, reply) {
    const resourceServers = [await getReadOnlyRServer(), ...(await api.getResourceServers())]
    return resourceServers.map(resourceServerMap)
  }

  async function createResourceServer(request, reply) {
    const { name, identifier, signingAlg } = request.body || {}
    const resourceServer = await api.createResourceServer({
      name,
      identifier,
      signingAlg
    })
    return resourceServerMap(resourceServer)
  }
}
