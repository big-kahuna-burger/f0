import '../env.js'
const { ISSUER } = process.env
const { protocol, hostname, port } = new URL(ISSUER)
const combined = port ? `${hostname}:${port}` : hostname

export const scopes = ['users:read', 'users:write', 'apis:read', 'apis:write']

export const identifier = `${protocol}//${combined}/manage/v1`

export const MANAGEMENT = {
  id: 'management',
  name: 'Management API',
  scopes,
  identifier,
  readonly: true
}
