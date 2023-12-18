import client from './client.js'
const loadAccounts = async ({ skip = 0, take = 20, cursor } = {}) => {
  const accounts = await client.account.findMany({
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
  const account = await client.account.update({
    where: { id },
    data
  })
  return account
}

const getAccount = async (id) => {
  const account = await client.account.findFirst({
    where: { id }
  })
  return account
}

export { getAccount, loadAccounts, updateAccount }

// console.log(await loadAccounts())
