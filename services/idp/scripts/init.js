import chalk from 'chalk'
import { nanoid } from 'nanoid'
import instance from 'oidc-provider/lib/helpers/weak_cache.js' // uhhh... this is not good
import prisma from '../db/client.js'
import '../env.js'
import { CORS_PROP } from '../oidc/client-based-cors/index.js'
import { default as configureProvider } from '../oidc/configure.js'
import { epochTime } from '../oidc/helpers/epoch.js'
import { upsertManagementApi } from '../resource-servers/initialize-management.js'

const { DASHBOARD_ORIGIN } = process.env

const { provider } = await configureProvider()
await upsertManagementApi()
const dashboard =
  (await findDashboardClient()) || (await createClient(provider))
const clientId = dashboard?.payload?.client_id

console.log(
  `Remember to add a ${chalk.cyan(
    `DASHBOARD_CLIENT_ID=${clientId}`
  )} to .env file in services/idp`
)

console.log(
  `Remember to add a ${chalk.cyan(
    `REACT_APP_DASHBOARD_CLIENT_ID=${clientId}`
  )} to .env file in services/manage`
)

const connection = await setupConnection()
await enableConnection(clientId, connection.id)

async function createClient(
  provider,
  { managementHost = DASHBOARD_ORIGIN } = {}
) {
  const metadata = {
    client_id: nanoid(22),
    client_name: 'Dashboard Client (Readonly)',
    client_id_issued_at: epochTime(),
    redirect_uris: [`${managementHost}/cb`],
    application_type: 'web',
    response_types: ['code'],
    grant_types: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_method: 'none',
    post_logout_redirect_uris: [`${managementHost}/cb`, `${managementHost}/`],
    'urn:f0:type': 'spa',
    [CORS_PROP]: [managementHost]
  }

  await instance(provider).clientAdd(metadata, { store: true })

  return prisma.oidcClient.update({
    where: { id: metadata.client_id },
    data: { readonly: true }
  })
}

async function findDashboardClient() {
  return prisma.oidcClient.findFirst({ where: { readonly: true } })
}

async function setupConnection() {
  const name = 'Tenant Members (Readonly)'
  const connection = await prisma.connection.findFirst({ where: { name } })
  if (connection) {
    return connection
  }
  return prisma.connection.create({
    data: { name, type: 'DB', readonly: true }
  })
}

async function enableConnection(clientId, connectionId) {
  return prisma.clientConnection.upsert({
    where: {
      clientId_connectionId_readonly: { clientId, connectionId, readonly: true }
    },
    create: { clientId, connectionId, readonly: true },
    update: {},
    include: { connection: true, client: true }
  })
}
