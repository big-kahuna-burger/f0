import '../env.js'
const { ISSUER } = process.env
const { protocol, hostname, port } = new URL(ISSUER)
const combined = port ? `${hostname}:${port}` : hostname

export const scopes = []
export const identifier = `${protocol}//${combined}/manage/v1`
export default { name: 'Management API', scopes, identifier, readonly: true }
