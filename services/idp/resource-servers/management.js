import '../env.js'
const { ISSUER } = process.env
const { protocol, hostname, port } = new URL(ISSUER)
const combined = port ? `${hostname}:${port}` : hostname

const scopes = Object.fromEntries([
  ['read:users', 'Read Application Users'],
  ['write:users', 'Create Application Users'],
  ['update:users', 'Update Application Users'],
  ['delete:users', 'Delete Application Users'],
  ['read:apis', 'Read APIs'],
  ['write:apis', 'Create APIs'],
  ['update:apis', 'Update APIs'],
  ['delete:apis', 'Delete APIs'],
  ['read:client_grants', 'Read Client Grants'],
  ['write:client_grants', 'Create Client Grants'],
  ['update:client_grants', 'Update Client Grants'],
  ['delete:client_grants', 'Delete Client Grants']
])

const identifier = `${protocol}//${combined}/manage/v1`

const MANAGEMENT = {
  id: 'management',
  name: 'Management API',
  scopes,
  identifier,
  readOnly: true,
  signingAlg: 'RS256'
}

export { MANAGEMENT, identifier, scopes }
export default MANAGEMENT
