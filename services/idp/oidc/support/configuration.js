import { errors } from 'oidc-provider'
import { defaults } from 'oidc-provider/lib/helpers/defaults.js'
import { CORS_PROP, corsPropValidator } from '../client-based-cors/index.js'
import ttl from './ttl.js'

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
// TODO dynamic features state loading
// TODO dynamic resource server loading

export default {
  extraClientMetadata: {
    properties: [CORS_PROP],
    validator(ctx, key, value, metadata) {
      if (key === CORS_PROP) {
        return corsPropValidator(value, metadata) // this can be context aware but not async really
      }
      return {}
    }
  },
  clientBasedCORS(ctx, origin, client) {
    // ctx.oidc.route can be used to exclude endpoints from this behaviour, in that case just return
    // true to always allow CORS on them, false to deny
    // you may also allow some known internal origins if you want to
    return client[CORS_PROP].includes(origin)
  },
  async renderError(ctx, out, error) {
    console.log('renderError', error)
    defaults.renderError(ctx, out, error)
  },
  clients: [
    {
      client_id: 'myClientID',
      client_secret: 'myClientSecret',
      client_name: 'My Client',
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: ['http://localhost:3036/cb'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      post_logout_redirect_uris: ['http://localhost:3036/logged-out'],
      [CORS_PROP]: ['http://localhost:3036']
    }
  ],
  interactions: {
    url: (ctx, { uid }) => `/interaction/${uid}`
  },
  cookies: {
    keys: [] // will be dynamically loaded
  },
  claims: {
    openid: ['sub'],
    address: ['address'],
    email: ['email', 'email_verified'],
    phone: ['phone_number', 'phone_number_verified'],
    profile: [
      'birthdate',
      'family_name',
      'gender',
      'given_name',
      'locale',
      'middle_name',
      'name',
      'nickname',
      'picture',
      'preferred_username',
      'profile',
      'updated_at',
      'website',
      'zoneinfo'
    ]
  },
  scopes: ['openid', 'offline_access', 'address', 'email', 'phone', 'profile'],
  clientAuthMethods: [
    'client_secret_basic',
    'client_secret_jwt',
    'client_secret_post',
    'private_key_jwt',
    'none'
  ],
  features: {
    clientCredentials: { enabled: true },
    devInteractions: { enabled: false },
    deviceFlow: { enabled: true },
    registration: { enabled: true }, // deal with open registration
    registrationManagement: { enabled: true }, // deal with open registration
    revocation: { enabled: true },
    claimsParameter: { enabled: true },
    backchannelLogout: { enabled: false },
    ciba: { enabled: false },
    dPoP: { enabled: true },
    encryption: { enabled: true },
    jwtUserinfo: { enabled: true },
    mTLS: { enabled: true },
    // jwtIntrospection: { enabled: true },
    // jwtResponseModes: { enabled: true },
    // pushedAuthorizationRequests: { enabled: true },
    // requestObjects: { enabled: true },
    resourceIndicators: {
      enabled: true,
      async defaultResource(ctx, client, oneOf) {
        // @param ctx - koa request context
        // @param client - client making the request
        // @param oneOf {string[]} - The OP needs to select **one** of the values provided.
        //                           Default is that the array is provided so that the request will fail.
        //                           This argument is only provided when called during
        //                           Authorization Code / Refresh Token / Device Code exchanges.
        if (oneOf) return oneOf
        return client.clientId === 'myClientID' ? MANAGEMENT.identifier : null // TODO: make this better
      },
      async getResourceServerInfo(ctx, resourceIndicator, client) {
        // @param ctx - koa request context
        // @param resourceIndicator - resource indicator value either requested or resolved by the defaultResource helper.
        // @param client - client making the request
        if (
          resourceIndicator === MANAGEMENT.identifier &&
          client.clientId === 'myClientID'
        ) {
          // TODO: Make this better
          return {
            scope: 'read:users update:users',
            audience: resourceIndicator,
            accessTokenTTL: 30 * 60, // 1/2 hours
            accessTokenFormat: 'jwt',
            jwt: {
              sign: { alg: 'ES256' }
            }
          }
        }
        throw new errors.InvalidTarget(
          `client "${client.clientId}" is not authorized to access requested "${resourceIndicator}" resource`
        )
      },
      async useGrantedResource(ctx, model) {
        // @param ctx - koa request context
        // @param model - depending on the request's grant_type this can be either an AuthorizationCode, BackchannelAuthenticationRequest,
        //                RefreshToken, or DeviceCode model instance.
        //                You can use the instanceof operator to determine the type.
        return true
      }
    },
    // introspection: { enabled: true },
    // rpInitiatedLogout: { enabled: true },
    // fapi: { enabled: true },
    userinfo: { enabled: true }
  },
  jwks: { keys: [] }, // will be dynamically loaded
  ttl
}
