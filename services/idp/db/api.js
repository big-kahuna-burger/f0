import { Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import { epochTime } from '../oidc/helpers/epoch.js'
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

const loadClients = async ({
  token_endpoint_auth_method_not,
  grant_types_include,
  skip = 0,
  take = 100,
  cursor
} = {}) => {
  const whereAND = []
  if (grant_types_include) {
    whereAND.push({
      payload: {
        path: ['grant_types'],
        array_contains: grant_types_include
      }
    })
  }
  if (token_endpoint_auth_method_not) {
    whereAND.push({
      payload: {
        path: ['token_endpoint_auth_method'],
        not: token_endpoint_auth_method_not
      }
    })
  }
  if (whereAND.length) {
    const clients = await prisma.oidcModel.findMany({
      skip,
      take,
      cursor,
      orderBy: {
        updatedAt: 'desc'
      },
      where: {
        type: 7,
        AND: whereAND
      }
    })
    return clients
  }
  const clients = await prisma.oidcModel.findMany({
    skip,
    take,
    cursor,
    orderBy: {
      updatedAt: 'asc'
    },
    where: {
      type: 7
    }
  })
  return clients
}

const loadGrantableClients = async ({ skip = 0, take = 100, cursor } = {}) => {
  const clients = await prisma.oidcModel.findMany({
    skip,
    take,
    cursor,
    orderBy: {
      updatedAt: 'asc'
    },
    where: {
      type: 7,
      payload: { path: ['grant_types'], array_contains: 'client_credentials' }
    }
  })
  return clients
}

const updateAccount = async (id, data) => {
  const account = await prisma.account.update({ where: { id }, data })
  return account
}

const getAccount = async (id) => {
  const account = await prisma.account.findFirst({ where: { id } })
  return account
}

const createGrant = async ({ clientId, scope, identifier }) => {
  console.log({ clientId, scope, identifier })
  const count = await prisma.oidcModel.count({
    where: {
      type: 13,
      AND: [
        {
          payload: { path: ['clientId'], equals: clientId }
        },
        {
          payload: { path: ['accountId'], equals: Prisma.DbNull }
        },
        {
          payload: { path: ['resources', identifier], not: Prisma.DbNull }
        },
        {
          payload: { path: ['exp'], equals: 0 }
        }
      ]
    }
  })
  if (count) {
    throw new Error('client grant already exists')
  }
  const jti = `RI-${nanoid(43)}`
  const grant = await prisma.oidcModel.create({
    data: {
      id: jti,
      type: 13,
      payload: {
        jti,
        kind: 'Grant',
        clientId,
        iat: epochTime(),
        exp: 0,
        resources: { [identifier]: scope }
      }
    }
  })
  return grant
}

const updateScopesForIdentifier = async (id, scopes, identifier) => {
  const found = await prisma.oidcModel.findFirst({ where: { id } })
  if (!found) {
    throw new Error('grant not found')
  }
  const resources = scopes.length
    ? {
        ...found.payload.resources,
        [identifier]: scopes.join(' ')
      }
    : found.payload.resources

  const grant = await prisma.oidcModel.update({
    where: { id },
    data: {
      payload: {
        ...found.payload,
        resources
      }
    }
  })
  return grant
}

const deleteGrant = async (id) => {
  const deleteResult = await prisma.oidcModel.delete({ where: { id } })
  return deleteResult
}

const createResourceServer = async ({
  name,
  identifier,
  signingAlg,
  scopes = []
}) => {
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

const getResourceServer = async (id) => {
  const resourceServer = await prisma.resourceServer.findFirst({
    where: { id }
  })
  return resourceServer
}

const getResourceServers = async () => {
  const resourceServers = await prisma.resourceServer.findMany()
  return resourceServers
}

const updateResourceServerScopes = async (id, add, remove) => {
  const resourceServer = await prisma.resourceServer.findFirst({
    where: { id }
  })
  if (!resourceServer) {
    throw new Error('resource server not found')
  }
  const scopes = { ...resourceServer.scopes }
  for (const { value, description } of add) {
    scopes[value] = description
  }

  for (const value of remove) {
    delete scopes[value]
  }

  const updated = await prisma.resourceServer.update({
    where: { id },
    data: { scopes }
  })
  return updated
}

const loadGrantsByResourceIdentifier = async ({
  identifier,
  skip = 0,
  take = 20,
  cursor
} = {}) => {
  if (!identifier) {
    throw new Error('identifier is required')
  }
  const grants = await prisma.oidcModel.findMany({
    skip,
    take,
    cursor,
    where: {
      type: 13,
      AND: [
        {
          payload: { path: ['resources', identifier], not: Prisma.DbNull }
        },
        {
          payload: { path: ['accountId'], equals: Prisma.DbNull }
        }
      ]
    }
  })

  return grants
    .map((x) => x.payload)
    .reduce((acc, x) => {
      const { jti, clientId, resources } = x
      const scope = resources[identifier] || ''
      const scopes = scope.split(' ')
      acc.push({ grantId: jti, clientId, scopes })
      return acc
    }, [])
}

async function updateResourceServer(
  id,
  { name, ttl, ttlBrowser, allowSkipConsent }
) {
  const rs = await prisma.resourceServer.update({
    where: { id },
    data: { name, ttl, ttlBrowser, allowSkipConsent }
  })
  return rs
}

export {
  getAccount,
  loadAccounts,
  loadClients,
  loadGrantableClients,
  updateAccount,
  createResourceServer,
  getResourceServers,
  getResourceServer,
  loadGrantsByResourceIdentifier,
  updateScopesForIdentifier,
  createGrant,
  deleteGrant,
  updateResourceServerScopes,
  updateResourceServer
}

// console.log(await loadAccounts())
