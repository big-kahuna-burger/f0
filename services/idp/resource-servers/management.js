import '../env.js'
const { ISSUER } = process.env
const { protocol, hostname, port } = new URL(ISSUER)
const combined = port ? `${hostname}:${port}` : hostname

const scopes = ['users:read', 'users:write', 'apis:read', 'apis:write']

const identifier = `${protocol}//${combined}/manage/v1`

const MANAGEMENT = {
  id: 'management',
  name: 'Management API',
  scopes,
  identifier,
  readonly: true
}
//comment
const READONLY = { MANAGEMENT, identifier, scopes }
export { MANAGEMENT, identifier, scopes }
export default READONLY
