import prisma from './client.js'

const loadAccounts = async ({ skip = 0, take = 20, cursor } = {}) => {
  const accounts = await prisma.account.findMany({
    include: {
      Profile: true
    },
    skip,
    take,
    cursor,
    orderBy: {
      updatedAt: 'asc'
    }
  })
  const flat = accounts.map((acc) => {
    const { Profile, ...account } = acc
    return { ...Profile[0], ...account }
  })
  return flat
}

const updateAccount = async (id, data) => {
  const account = await prisma.account.update({ where: { id }, data })
  return account
}

const getAccount = async (id) => {
  const account = await prisma.account.findFirst({ where: { id } })
  return account
}

const createResourceServer = async ({ name, identifier, signingAlg, scopes = [] }) => {
  const resourceServer = await prisma.resourceServer.create({
    data: {
      name,
      identifier,
      signingAlg,
      scopes
    }
  })
  return resourceServer
}

const getResourceServers = async () => {
  const resourceServers = await prisma.resourceServer.findMany()
  return resourceServers
}

export { getAccount, loadAccounts, updateAccount, createResourceServer, getResourceServers }

// console.log(await loadAccounts())
