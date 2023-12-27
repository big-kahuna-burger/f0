import got from 'got'
import { Issuer } from 'openid-client'
const { ISSUER = 'http://localhost:9876/oidc' } = process.env
const issuer = await Issuer.discover(ISSUER)

const openregClient = await issuer.Client.register({
  'urn:f0:client:allowed-cors-origins': [], // it's super important to also add all allowed CORS origins here,
  // this should be an array of urls as strings for the frontends that will use this client
  // it will be taken into account on OIDC server side when dealing with CORS requests
  // that browsers will trigger from the frontend apps using the registered client_id
  redirect_uris: [],
  response_types: [],
  application_type: 'native',
  client_name: `Dynamic Client Registration at ${Date.now()}`,
  token_endpoint_auth_method: 'client_secret_post',
  grant_types: ['client_credentials']
  // 'urn:f0:type': 'm2m'
})

process.stdin.pause()
const resource = 'https://pltf.vlv'
query(resource, async () => {
  try {
    const tokenSet = await openregClient.grant({
      grant_type: 'client_credentials',
      scope: 'read:users write:users random:thing',
      resource
    })
    const grant = await got.get('http://localhost:3042/echo-user', {
      headers: {
        Authorization: `Bearer ${tokenSet.access_token}`
      }
    })
    console.log(grant.body)
  } catch (error) {
    console.log(error)
  }
})

function query(text, callback) {
  process.stdin.resume()
  process.stdout.write(`Please wait until granted access to: ${text}`)
  process.stdin.once('data', (data) => {
    callback(data.toString().trim())
  })
}
