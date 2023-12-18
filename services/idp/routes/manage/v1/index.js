import * as api from '../../../db/api.js'
import { accountMAP, resourceServerMap } from '../../../db/mappers/account.js'
import { getResourceServers } from '../../../resource-servers/index.js'

export default async function interactionsRouter(fastify, opts) {
  fastify.get('/users/:id', getUser)
  fastify.get('/users', getUsers)
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
    const resourceServers = await getResourceServers()
    return resourceServers.map(resourceServerMap)
  }
}