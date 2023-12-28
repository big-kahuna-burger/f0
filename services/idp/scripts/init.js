import { nanoid } from 'nanoid'
import instance from 'oidc-provider/lib/helpers/weak_cache.js' // uhhh... this is not good
import prisma from '../db/client.js'
import '../env.js'
import { CORS_PROP } from '../oidc/client-based-cors/index.js'
import { default as configureProvider } from '../oidc/configure.js'
import { epochTime } from '../oidc/helpers/epoch.js'

async function main() {
  const { provider } = await configureProvider()
  const dashboard = await findDashboardClient()
  let client_id
  if (!dashboard) {
    console.log('Creating Dashboard Client')
    client_id = await createClient(provider)
  } else {
    console.log('Dashboard Client already exists. Skipping.')
    client_id = dashboard.id
  }
  const clientId = dashboard?.payload?.client_id
  console.log(
    `ACTION NEEDED: Add a DASHBOARD_CLIENT_ID=${clientId} to .env file on services/idp side`
  )
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
// 1. Create a "this" "Connection" (connection model) for Tenant Members
// 2. Create a "this" "Client" (oidc model type 7) for Management Dashboard
// 3. Create a "this" ResourceServer (resource server model) Management API for interacting with the Management Dashboard and with CLIs
// 4. Create a Account in Connection (1.) for bootstraping the Management Dashboard
async function createClient(
  provider,
  { managementHost = 'http://localhost:3036' } = {}
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

  const client = await instance(provider).clientAdd(metadata, { store: true })
  // now load record using prisma model directly and toggle the readonly flag
  await prisma.oidcClient.update({
    where: { id: metadata.client_id },
    data: { readonly: true }
  })

  return metadata.client_id
}

async function findDashboardClient() {
  return prisma.oidcClient.findFirst({ where: { readonly: true } })
}
