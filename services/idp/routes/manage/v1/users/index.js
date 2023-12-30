import * as api from '../../../../db/api.js'
import { accountMAP } from '../../../../db/mappers/account.js'

export default async function managementRouter(fastify, opts) {
  fastify.get('/:id', getUser)
  fastify.get('/', getUsers)

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
