import { formatDistanceToNow, parseJSON } from 'date-fns'
export {
  getUsers,
  getResourceServer,
  getResourceServers,
  createResourceServer,
  getApplications,
  getApplicationsGrantable
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

async function getApplicationsGrantable(id) {
  const opts = { headers: getHeaders() }
  const applicationsGrantableResponse = await fetch(`${baseUrl}/api/${id}/grantable`, opts)
  const json = await applicationsGrantableResponse.json()
  return json.map((x) => x.payload)
}

async function getApplications() {
  const opts = { headers: getHeaders() }
  const applicationsResponse = await fetch(applicationsUrl, opts)
  const applicationsJson = await applicationsResponse.json()
  return applicationsJson.map((x) => x.payload)
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

const getToken = () =>
  (localStorage.getItem('ROCP_token') || '')
    .split('"')
    .filter((x) => x.length)[0]
const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` })
