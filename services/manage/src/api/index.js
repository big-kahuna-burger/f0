import { formatDistanceToNow, parseJSON } from 'date-fns'
import qs from 'qs'
export {
  getUsers,
  getResourceServer,
  getResourceServers,
  createResourceServer,
  getApplications,
  getApplicationGrants,
  createGrant,
  updateGrantById,
  deleteGrantById,
  updateResourceServerScopes,
  updateApi
}
const baseUrl = 'http://localhost:9876/manage/v1'

const usersUrl = `${baseUrl}/users`
const resourceServersUrl = `${baseUrl}/apis`
const apiCreateUrl = `${baseUrl}/apis/create`
const applicationsUrl = `${baseUrl}/apps`

async function createResourceServer({ name, identifier, signingAlg }) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify({ name, identifier, signingAlg })
  }
  const resourceServersCreateResponse = await fetch(apiCreateUrl, opts)
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
  try {
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
  } catch (error) {
    console.log(error)
  }
}

async function getApplicationGrants(id) {
  const opts = { headers: getHeaders() }
  const applicationGrants = await fetch(`${baseUrl}/api/${id}/grants`, opts)
  const json = await applicationGrants.json()
  return json
}

async function getApplications({
  type,
  page = 0,
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
        page,
        size,
        include,
        grant_types_include,
        token_endpoint_auth_method_not
      },
      { arrayFormat: 'comma' }
    )}`,
    opts
  )
  const applicationsJson = await applicationsResponse.json()
  return applicationsJson
}

async function createGrant({ identifier, clientId }) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders() },
    body: JSON.stringify({ identifier, clientId })
  }
  const response = await fetch(`${baseUrl}/grants/create`, opts)
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

async function updateApi (id, data) {
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
