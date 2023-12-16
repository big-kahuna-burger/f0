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
    if (key === 'Profile') {
      acc.profile = Object.entries(value).reduce((acc, [key, value]) => {
        if (key === 'addressId') {
          return acc
        }
        if (key === 'address') {
          acc.address = Object.entries(value).reduce((acc, [key, value]) => {
            if (key === 'id') {
              return acc
            }
            acc[snakeCase(key)] = value
            return acc
          }, {})
        } else {
          acc[snakeCase(key)] = value
        }
        return acc
      }, {})
    } else {
      acc[snakeCase(key)] = value
    }
    return acc
  }, {})
}

const snakeCase = (str = '') =>
  str.replace(/([A-Z][a-z])/g, (x) => `_${x}`.toLowerCase()).replace(/^_+/, '')
