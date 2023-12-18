import * as api from '../../db/api.js'

export default async function interactionsRouter(fastify, opts) {
  fastify.get('/users/:id', getUser)
  fastify.get('/users', getUsers)

  async function getUser(request, reply) {
    const account = await api.getAccount(request.params.id)
    return accountMAP(account)
  }

  async function getUsers(request, reply) {
    const { page = 1, size = 20 } = request.query

    const accounts = await api.loadAccounts({ page, size })
    return accounts.map(accountMAP)
  }
}

function accountMAP(acct) {
  return Object.entries(acct).reduce((acc, [key, value]) => {
    acc[snakeCase(key)] = value
    return acc
  }, {})
}

const snakeCase = (str = '') =>
  str.replace(/([A-Z][a-z])/g, (x) => `_${x}`.toLowerCase()).replace(/^_+/, '')
