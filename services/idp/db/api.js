import crypto from 'crypto'
import { promisify } from 'util'
import { Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import { CORS_PROP, F0_TYPE_PROP } from '../oidc/client-based-cors/index.js'
import { epochTime } from '../oidc/helpers/epoch.js'
import prisma from './client.js'

const randomFill = promisify(crypto.randomFill)

async function secretFactory() {
  const bytes = Buffer.allocUnsafe(64)
  await randomFill(bytes)
  return bytes.toString('base64url')
}

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

const getClient = async (id) => {
  const client = await prisma.oidcClient.findFirst({
    where: { id },
    include: {
      ClientConnection: {
        include: {
          connection: true
        }
      }
    }
  })
  return client
}

const updateClient = async (
  id,
  {
    clientName,
    type,
    redirectUris = [],
    postLogoutRedirectUris = [],
    initiateLoginUri,
    logoUri
  }
) => {
  const foundClient = await prisma.oidcClient.findFirst({ where: { id } })
  if (!foundClient) {
    throw new Error('client not found')
  }

  if (foundClient.readonly) {
    throw new Error(`OIDC client is read only ${id}`)
  }

  const client = await prisma.oidcClient.update({
    where: { id },
    data: {
      payload: {
        ...foundClient.payload,
        client_name: clientName,
        redirect_uris: redirectUris,
        post_logout_redirect_uris: postLogoutRedirectUris,
        initiate_login_uri: initiateLoginUri,
        logo_uri: logoUri,
        [F0_TYPE_PROP]: type
        // [CORS_PROP]: [],
      }
    }
  })
  return client
}

const createClient = async ({ name, type }) => {
  const id = nanoid(21)
  const payload = {
    client_id: id,
    client_name: name,
    grant_types: [],
    subject_type: 'public',
    client_secret: await secretFactory(),
    redirect_uris: [],
    response_types: ['code'],
    application_type: 'native',
    require_auth_time: false,
    client_id_issued_at: epochTime(),
    client_secret_expires_at: 0,
    dpop_bound_access_tokens: false,
    post_logout_redirect_uris: [],
    token_endpoint_auth_method: 'client_secret_post',
    id_token_signed_response_alg: 'RS256',
    require_pushed_authorization_requests: false,
    // [CORS_PROP]: [],
    [F0_TYPE_PROP]: type
  }
  switch (type) {
    case 'spa':
      payload.token_endpoint_auth_method = 'none'
      payload.grant_types = ['authorization_code', 'refresh_token']
      break
    case 'native':
      payload.grant_types = ['authorization_code', 'refresh_token']
      payload.token_endpoint_auth_method = 'none'
      break
    case 'web':
      payload.grant_types = [
        'authorization_code',
        'client_credentials',
        'refresh_token'
      ]
      break
    case 'm2m':
      payload.grant_types = ['client_credentials']
      payload.response_types = []
      break
    default:
      throw new Error('invalid client type')
  }

  const data = { id, payload, readonly: false }
  const client = await prisma.oidcClient.create({ data })
  return client.payload
}

const loadClients = async ({
  token_endpoint_auth_method_not,
  grant_types_include,
  page = 1,
  size = 20
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
  const skip = (page - 1) * size
  const orderBy = [{ readonly: 'desc' }, { updatedAt: 'desc' }]

  if (whereAND.length) {
    const total = await prisma.oidcClient.count({
      orderBy,
      where: { AND: whereAND }
    })
    const clients = await prisma.oidcClient.findMany({
      skip,
      take: size,
      orderBy,
      where: { AND: whereAND }
    })
    return { clients, total }
  }

  const clients = await prisma.oidcClient.findMany({
    skip,
    take: size,
    orderBy
  })
  const total = await prisma.oidcClient.count({ orderBy })
  return { clients, total }
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
  const rs = await prisma.resourceServer.findFirst({
    where: { identifier }
  })

  if (!rs) {
    throw new Error('resource server not found')
  }
  const possible = Object.keys(rs.scopes)
  const valid = scopes.filter((x) => possible.includes(x))

  const grant = await prisma.oidcModel.update({
    where: { id },
    data: {
      payload: {
        ...found.payload,
        resources: {
          ...found.payload.resources,
          [identifier]: valid.join(' ')
        }
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
  let signingSecret
  if (signingAlg === 'HS256') {
    signingSecret = nanoid(32)
  }
  const resourceServer = await prisma.resourceServer.create({
    data: {
      name,
      identifier,
      signingAlg,
      scopes,
      signingSecret
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

const deleteClient = async (id) => {
  const client = await prisma.oidcClient.findFirst({ where: { id } })
  if (!client) {
    return true
  }
  if (client.readonly) {
    throw new Error('Cannot delete read only client')
  }
  const deleteResult = await prisma.oidcClient.delete({ where: { id } })
  return deleteResult
}

const deleteResourceServer = async (id) => {
  return prisma.$transaction(async (t) => {
    const rs = await t.resourceServer.findFirst({
      where: { id }
    })
    if (!rs) {
      return true
    }
    const { identifier } = rs
    // look for client grants and remove it
    const grants = await t.oidcModel.findMany({
      where: {
        type: 13,
        AND: [
          {
            payload: { path: ['accountId'], equals: Prisma.DbNull }
          },
          {
            payload: { path: ['exp'], equals: 0 }
          },
          {
            payload: {
              path: ['resources', identifier],
              not: Prisma.DbNull
            }
          }
        ]
      }
    })
    const updatedGrants = await Promise.all(
      grants.map(({ id, payload }) => {
        const { resources } = payload
        delete resources[identifier]
        return t.oidcModel.update({
          where: { id },
          data: {
            payload: {
              ...payload,
              resources
            }
          }
        })
      })
    )

    const deleteResult = await t.resourceServer.delete({ where: { id } })
    return { deleteResult, updatedGrants }
  })
}

const getResourceServers = async ({ sort = 'desc', page = 1, size = 20 }) => {
  const take = size
  const skip = (page - 1) * take
  const orderBy = [{ readOnly: sort }, { updatedAt: sort }]

  const total = await prisma.resourceServer.count()
  const resourceServers = await prisma.resourceServer.findMany({
    skip,
    take,
    orderBy
  })
  return { resourceServers, total }
}

const updateResourceServerScopes = async (id, add, remove) => {
  return prisma.$transaction(async (t) => {
    const resourceServer = await t.resourceServer.findFirst({
      where: { id }
    })
    if (!resourceServer) {
      throw new Error('resource server not found')
    }
    const scopeKeys = Object.keys(resourceServer.scopes)
    const scopeCopy = { ...resourceServer.scopes }
    for (const { value, description } of add) {
      scopeCopy[value] = description
      scopeKeys.push(value)
    }

    for (const value of remove) {
      delete scopeCopy[value]
      scopeKeys.splice(scopeKeys.indexOf(value), 1)
    }

    if (remove.length) {
      console.log('entering removal part for grants')
      const foundGrants = await t.oidcModel.findMany({
        where: {
          type: 13,
          AND: [
            {
              payload: { path: ['accountId'], equals: Prisma.DbNull }
            },
            {
              payload: { path: ['exp'], equals: 0 }
            },
            {
              payload: {
                path: ['resources', resourceServer.identifier],
                not: Prisma.DbNull
              }
            }
          ]
        }
      })
      for (const { payload, id } of foundGrants) {
        const { resources } = payload
        const nextGrantedScopes = resources[resourceServer.identifier]
          .split(' ')
          .filter((s) => scopeCopy[s])
          .join(' ')

        await t.oidcModel.update({
          where: { id },
          data: {
            payload: {
              ...payload,
              resources: {
                ...resources,
                [resourceServer.identifier]: nextGrantedScopes
              }
            }
          }
        })
        console.log(
          'updated client grant id',
          id,
          { scopeKeys, scopeCopy, 'for client': payload.clientId },
          { nextGrantedScopes, 'for client': payload.clientId }
        )
      }
    }
    const updated = await t.resourceServer.update({
      where: { id },
      data: { scopes: scopeCopy }
    })
    return updated
  })
}

const loadGrantsByResourceIdentifier = async ({
  identifier,
  skip = 0,
  take = 100,
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
      const scope = resources[identifier]
      const scopes = scope.split(' ').filter((x) => Boolean(x.length))
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

async function getConnections({
  skip = 0,
  take = 100,
  cursor,
  type = 'db'
} = {}) {
  const connections = await prisma.connection.findMany({
    skip,
    take,
    cursor,
    orderBy: {
      updatedAt: 'desc'
    },
    where: {
      type: type.toUpperCase()
    }
  })
  return connections
}

async function getConnection(id) {
  const connection = await prisma.connection.findFirst({
    where: { id },
    include: { ClientConnection: true }
  })

  return connection
}

async function deleteConnection(id) {
  const deleteResult = await prisma.connection.delete({ where: { id } })
  return deleteResult
}

async function addConnectionToClient(clientId, connectionId) {
  return prisma.clientConnection.create({
    data: {
      clientId,
      connectionId,
      readonly: false
    }
  })
}

async function removeConnectionFromClient(clientId, connectionId) {
  const deleteResult = await prisma.clientConnection.delete({
    where: {
      clientId_connectionId_readonly: {
        clientId,
        connectionId,
        readonly: false
      }
    }
  })
  return deleteResult
}

export {
  getAccount,
  loadAccounts,
  getClient,
  createClient,
  updateClient,
  loadClients,
  updateAccount,
  createResourceServer,
  getResourceServers,
  getResourceServer,
  loadGrantsByResourceIdentifier,
  updateScopesForIdentifier,
  createGrant,
  deleteGrant,
  updateResourceServerScopes,
  updateResourceServer,
  getConnections,
  getConnection,
  deleteConnection,
  deleteResourceServer,
  deleteClient,
  addConnectionToClient,
  removeConnectionFromClient
}

// console.log(await loadAccounts())
