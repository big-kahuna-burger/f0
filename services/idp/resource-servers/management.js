import '../env.js'
const { ISSUER } = process.env
const { protocol, hostname, port } = new URL(ISSUER)
const combined = port ? `${hostname}:${port}` : hostname

const scopes = [
  'read:users',
  'write:users',
  'update:users',
  'delete:users',
  'read:apis',
  'write:apis',
  'update:apis',
  'delete:apis',
  'read:client_grants',
  'write:client_grants',
  'update:client_grants',
  'delete:client_grants'
]

const identifier = `${protocol}//${combined}/manage/v1`

const MANAGEMENT = {
  id: 'management',
  name: 'Management API',
  scopes,
  identifier,
  readonly: true,
  signingAlg: 'RS256'
}
//comment
const READONLY = { MANAGEMENT, identifier, scopes }
export { MANAGEMENT, identifier, scopes }
export default READONLY
