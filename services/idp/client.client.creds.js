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
  token_endpoint_auth_method: 'client_secret_post',
  grant_types: ['client_credentials']
})

const tokenSet = await openregClient.grant({
  grant_type: 'client_credentials',
  scope: 'read:users write:users',
  resource: 'http://localhost:9876/manage/v1'
})

const { body } = await openregClient.requestResource('http://localhost:9876/manage/v1/users', tokenSet.access_token)

console.log(tokenSet, JSON.parse(body.toString())[0])
