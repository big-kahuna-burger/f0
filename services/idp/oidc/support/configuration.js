import { defaults } from 'oidc-provider/lib/helpers/defaults.js'
import { CORS_PROP, corsPropValidator } from '../client-based-cors/index.js'
import ttl from './ttl.js'

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
  features: {
    clientCredentials: { enabled: true },
    devInteractions: { enabled: false },
    deviceFlow: { enabled: true },
    registration: { enabled: true },
    revocation: { enabled: true },
    claimsParameter: { enabled: true },
    backchannelLogout: { enabled: false },
    ciba: { enabled: false },
    dPoP: { enabled: true },
    // encryption: { enabled: true },
    // fapi: { enabled: true },
    // introspection: { enabled: true },
    // jwtIntrospection: { enabled: true },
    // jwtResponseModes: { enabled: true },
    // jwtUserinfo: { enabled: true },
    // mTLS: { enabled: true },
    // pushedAuthorizationRequests: { enabled: true },
    // registrationManagement: { enabled: true },
    // requestObjects: { enabled: true },
    // resourceIndicators: { enabled: true },
    // rpInitiatedLogout: { enabled: true },
    // userinfo: { enabled: true }
  },
  jwks: { keys: [] }, // will be dynamically loaded
  ttl
}
