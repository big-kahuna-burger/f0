import crypto from 'crypto'
import { promisify } from 'util'
import { Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import { CORS_PROP, F0_TYPE_PROP } from '../oidc/client-based-cors/index.js'
import prisma from './client.js'

const randomFill = promisify(crypto.randomFill)

async function updateResourceServer(id, data) {
  const rs = await prisma.resourceServer.update({ where: { id }, data })
  return rs
}

async function getClient(id) {
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

async function updateClient(
  id,
  {
    type,
    logoUri,
    clientName,
    grantTypes,
    redirectUris,
    initiateLoginUri,
    postLogoutRedirectUris,
    tokenEndpointAuthMethod,
    rotateSecret
  }
) {
  const foundClient = await prisma.oidcClient.findFirst({ where: { id } })
  if (!foundClient) {
    const err = new Error('client not found')
    err.code = 404
    return [err]
  }

  if (foundClient.readonly) {
    const err = new Error('client is readonly')
    err.code = 403
    return [err]
  }
  const payload = {
    ...foundClient.payload
  }
  if (clientName) {
    payload.client_name = clientName
  }
  if (type) {
    payload[F0_TYPE_PROP] = type
  }
  if (redirectUris) {
    payload.redirect_uris = [...new Set(redirectUris)]
  }
  if (postLogoutRedirectUris) {
    payload.post_logout_redirect_uris = [...new Set(postLogoutRedirectUris)]
  }
  if (initiateLoginUri) {
    payload.initiate_login_uri = initiateLoginUri
  }
  if (logoUri) {
    payload.logo_uri = logoUri
  }
  if (grantTypes) {
    payload.grant_types = grantTypes
  }
  if (tokenEndpointAuthMethod) {
    payload.token_endpoint_auth_method = tokenEndpointAuthMethod
    if (tokenEndpointAuthMethod === 'none') {
      payload.grant_types = payload.grant_types.filter(
        (gt) => gt !== 'client_credentials'
      )
      payload.client_secret = undefined
      payload.client_secret_expires_at = undefined
      payload.client_secret_issued_at = undefined
    } else if (!payload.client_secret) {
      payload.client_secret = await secretFactory()
      payload.client_secret_expires_at = 0
      payload.client_secret_issued_at = epochTime()
    }
  }
  if (rotateSecret === true) {
    payload.client_secret = await secretFactory()
    payload.client_secret_expires_at = 0
    payload.client_secret_issued_at = epochTime()
  }
  const client = await prisma.oidcClient.update({
    where: { id },
    data: { payload }
  })
  return [null, client]
}

function epochTime(date = Date.now()) {
  return Math.round(date / 1000)
}

async function createClient({ name, type }) {
  const id = nanoid(21)
  const clientSecret = await secretFactory()
  const issuedAt = epochTime()
  const payload = {
    client_id: id,
    client_name: name,
    grant_types: [],
    subject_type: 'public',
    client_secret: clientSecret,
    redirect_uris: [],
    response_types: ['code'],
    application_type: 'native',
    require_auth_time: false,
    client_id_issued_at: issuedAt,
    client_secret_expires_at: 0,
    dpop_bound_access_tokens: false,
    post_logout_redirect_uris: [],
    token_endpoint_auth_method: 'client_secret_post',
    id_token_signed_response_alg: 'RS256',
    require_pushed_authorization_requests: false,
    'urn:f0:type': type
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

async function loadClients({
  token_endpoint_auth_method_not,
  grant_types_include,
  page = 1,
  size = 20
} = {}) {
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

async function updateAccount(id, data) {
  const account = await prisma.account.update({ where: { id }, data })
  return account
}

async function getAccount(id) {
  const account = await prisma.account.findFirst({
    where: { id },
    include: {
      Profile: {
        include: {
          Address: true
        }
      }
    }
  })
  return flattenAccount(account)
}

async function createGrant({ clientId, scope, identifier }) {
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
    const err = new Error('grant already exists')
    err.code = 409
    return [err]
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
  return [null, grant]
}

async function updateScopesForIdentifier(id, scopes, identifier) {
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
  const data = {
    payload: {
      ...found.payload,
      resources: {
        ...found.payload.resources,
        [identifier]: valid.join(' ')
      }
    }
  }
  const grant = await prisma.oidcModel.update({ where: { id }, data })
  return grant
}

async function deleteGrant(id) {
  const deleteResult = await prisma.oidcModel.delete({
    where: { id, type: 13 }
  })
  return deleteResult
}

async function createResourceServer({
  name,
  identifier,
  signingAlg,
  scopes = []
}) {
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

async function getResourceServer(id) {
  const resourceServer = await prisma.resourceServer.findFirst({
    where: { id }
  })
  return resourceServer
}

async function deleteClient(id) {
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

async function deleteResourceServer(id) {
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

async function getResourceServers({ sort = 'desc', page = 1, size = 20 }) {
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

async function updateResourceServerScopes(id, add, remove) {
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

async function loadGrantsByResourceIdentifier({
  identifier,
  skip = 0,
  take = 100
} = {}) {
  if (!identifier) {
    throw new Error('identifier is required')
  }
  const grants = await prisma.oidcModel.findMany({
    skip,
    take,
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
    orderBy: { updatedAt: 'desc' },
    where: { type: type.toUpperCase() }
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

async function secretFactory() {
  const bytes = Buffer.allocUnsafe(64)
  await randomFill(bytes)
  return bytes.toString('base64url')
}

function flattenAccount(acc) {
  const { Profile, ...account } = acc
  const { Address, addressId, ...p } = Profile[0]

  return { ...account, ...p, ...Address }
}
async function loadAccounts({ skip = 0, take = 20 } = {}) {
  const accounts = await prisma.account.findMany({
    include: {
      Profile: {
        include: {
          Address: true
        }
      },
      Identity: {
        include: {
          Connection: true
        }
      }
    },
    skip,
    take,
    orderBy: {
      updatedAt: 'asc'
    }
  })
  const flat = accounts.map((acc) => flattenAccount(acc))
  return flat
}
// console.log(await loadAccounts())
