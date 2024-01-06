import { formatDistanceToNow, parseJSON } from 'date-fns'
import qs from 'qs'
export {
  createResourceServer,
  createGrant,
  createApplication,
  deleteGrantById,
  getApplication,
  getApplicationGrants,
  getApplications,
  getConnections,
  getResourceServer,
  getResourceServers,
  getUsers,
  updateApi,
  updateApplication,
  updateGrantById,
  updateResourceServerScopes,
  enableDisableConnection,
  deleteApi,
  getOidcMetadata
}

const baseUrl = `${new URL(process.env.REACT_APP_ISSUER).origin}/manage/v1`

const usersUrl = `${baseUrl}/users`
const resourceServersUrl = `${baseUrl}/apis`
const applicationsUrl = `${baseUrl}/apps`

async function getOidcMetadata() {
  const wellKnown = `${process.env.REACT_APP_ISSUER}/.well-known/openid-configuration`
  const response = await fetch(wellKnown)
  const json = await response.json()
  return json
}

async function deleteApi(id) {
  const opts = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getHeaders() }
  }
  const response = await fetch(`${baseUrl}/api/${id}`, opts)
  const json = await response.json()
  return json
}

async function enableDisableConnection(clientId, connectionId, enabled) {
  const opts = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify({ enabled })
  }
  const url = `${baseUrl}/app/${clientId}/connection/${connectionId}/${
    enabled ? 'disable' : 'enable'
  }`
  const response = await fetch(url, opts)
  const json = await response.json()
  return json
}

async function getConnections({ page = 1, size = 20, type = 'db' } = {}) {
  const opts = { headers: getHeaders() }
  const q = { page, size, type }
  const connectionsUrl = `${baseUrl}/connections?${qs.stringify(q)}`

  const connectionsResponse = await fetch(connectionsUrl, opts)
  const connectionsJson = await connectionsResponse.json()

  return connectionsJson.map((x) => ({
    ...x,
    formattedUpdatedAt: x.updatedAt
      ? formatDistanceToNow(parseJSON(x.updatedAt), { addSuffix: true })
      : undefined
  }))
}

async function createApplication({ name, type }) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify({ name, 'urn:f0:type': type.toLowerCase() })
  }
  const applicationsCreateResponse = await fetch(applicationsUrl, opts)
  return applicationsCreateResponse.json()
}

async function createResourceServer({ name, identifier, signingAlg }) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify({ name, identifier, signingAlg })
  }
  const resourceServersCreateResponse = await fetch(resourceServersUrl, opts)
  return resourceServersCreateResponse.json()
}

async function getResourceServers() {
  const opts = { headers: getHeaders() }
  const resourceServersResponse = await fetch(resourceServersUrl, opts)
  const json = await resourceServersResponse.json()

  return json.map((x) => ({
    ...x,
    formattedUpdatedAt: x.updatedAt
      ? formatDistanceToNow(parseJSON(x.updatedAt), { addSuffix: true })
      : undefined
  }))
}

async function getResourceServer(id) {
  const opts = { headers: getHeaders() }
  const resourceServerResponse = await fetch(
    `${resourceServersUrl}/${id}`,
    opts
  )
  const json = await resourceServerResponse.json()
  if (json.updatedAt) {
    return {
      ...json,
      formattedUpdatedAt: formatDistanceToNow(parseJSON(json.updatedAt), {
        addSuffix: true
      })
    }
  }
  return json
}

async function getApplicationGrants(id) {
  const opts = { headers: getHeaders() }
  const applicationGrants = await fetch(`${baseUrl}/api/${id}/grants`, opts)
  const json = await applicationGrants.json()
  return json
}

async function getApplication(id) {
  const opts = { headers: getHeaders() }
  const application = await fetch(`${baseUrl}/app/${id}`, opts)
  const json = await application.json()
  return {
    ...json,
    redirect_uris: json.redirect_uris.join(','),
    post_logout_redirect_uris: json.post_logout_redirect_uris.join(',')
  }
}

async function updateApplication(
  id,
  {
    client_name,
    initiate_login_uri,
    redirect_uris,
    post_logout_redirect_uris,
    'urn:f0:type': type,
    logo_uri,
    grant_types,
    token_endpoint_auth_method,
    rotate_secret
  }
) {
  const body = {}
  if (redirect_uris) {
    body.redirect_uris = redirect_uris
      .split(',')
      .map((x) => x.trim())
      .filter((x) => Boolean(x.length))
  }
  if (initiate_login_uri) {
    body.initiate_login_uri = initiate_login_uri.trim()
  }
  if (post_logout_redirect_uris) {
    body.post_logout_redirect_uris = post_logout_redirect_uris
      .split(',')
      .map((x) => x.trim())
      .filter((x) => Boolean(x.length))
  }
  if (client_name) {
    body.client_name = client_name
  }
  if (grant_types) {
    body.grant_types = grant_types
  }
  if (logo_uri?.length) {
    body.logo_uri = logo_uri
  }
  if (type) {
    body['urn:f0:type'] = type
  }
  if (token_endpoint_auth_method) {
    body.token_endpoint_auth_method = token_endpoint_auth_method
  }
  if (rotate_secret !== undefined) {
    body.rotate_secret = rotate_secret
  }

  const opts = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify(body)
  }
  const response = await fetch(`${baseUrl}/app/${id}`, opts)
  const json = await response.json()
  return json
}

async function getApplications({
  type,
  page = 1,
  size = 20,
  include,
  grant_types_include,
  token_endpoint_auth_method_not
} = {}) {
  const opts = { headers: getHeaders() }
  const applicationsResponse = await fetch(
    `${applicationsUrl}?${qs.stringify(
      {
        type,
        page: Math.max(1, page),
        size,
        include,
        grant_types_include,
        token_endpoint_auth_method_not
      },
      { arrayFormat: 'comma' }
    )}`,
    opts
  )

  const total = applicationsResponse.headers.get('x-total-count')
  const applicationsJson = await applicationsResponse.json()
  return {
    apps: applicationsJson.map((x) => ({
      ...x,
      formattedUpdatedAt: x.updatedAt
        ? formatDistanceToNow(parseJSON(x.updatedAt), { addSuffix: true })
        : undefined
    })),
    total
  }
}

async function createGrant({ identifier, clientId }) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify({ identifier, clientId })
  }
  const response = await fetch(`${baseUrl}/grants`, opts)
  const json = await response.json()
  return json
}

async function updateGrantById(id, scopes, identifier) {
  const opts = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify({
      scopes,
      identifier
    })
  }
  const response = await fetch(`${baseUrl}/grants/${id}`, opts)
  const json = await response.json()
  return json
}

async function deleteGrantById(id) {
  const opts = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getHeaders() }
  }
  const response = await fetch(`${baseUrl}/grants/${id}`, opts)
  const json = await response.json()
  return json
}

async function updateResourceServerScopes(id, { add, remove }) {
  const opts = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify({ add, remove })
  }
  const response = await fetch(`${baseUrl}/api/${id}/scopes`, opts)
  const json = await response.json()
  return json
}

async function getUsers() {
  const opts = { headers: getHeaders() }
  const usersResponse = await fetch(usersUrl, opts)
  const usersJson = await usersResponse.json()

  return usersJson.map((u, i) => ({
    ...u,
    name: `${u.given_name} ${u.family_name}`,
    picture: `https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-${
      (i % 10) + 1
    }.png`,
    stats: [
      { value: Math.round(Math.random() * 255), label: 'Logins' },
      { value: '2h ago', label: 'Last Login' },
      { value: '4', label: 'Devices' },
      { value: '2', label: 'IPs' },
      { value: '1.1.1.1', label: 'Last IP' }
    ]
  }))
}

async function updateApi(id, data) {
  const opts = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify(data)
  }
  const response = await fetch(`${baseUrl}/api/${id}`, opts)
  const json = await response.json()
  return json
}

const getToken = () =>
  (localStorage.getItem('ROCP_token') || '')
    .split('"')
    .filter((x) => x.length)[0]
const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` })
