import * as api from '../../../../db/api.js'
import { accountMAP } from '../../../../db/mappers/account.js'

export default async function usersRouter(fastify, opts) {
  fastify.get('/:id', { onRequest: fastify.authenticate }, getUser)
  fastify.get('/', { onRequest: fastify.authenticate }, getUsers)

  async function getUser(request) {
    const account = await api.getAccount(request.params.id)
    return accountMAP(account)
  }

  async function getUsers(request) {
    const { page = 1, size = 20 } = request.query

    const accounts = await api.loadAccounts({ page, size })
    return accounts.map(accountMAP)
  }
}
