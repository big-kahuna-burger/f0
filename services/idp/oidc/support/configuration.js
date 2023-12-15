import { defaults } from 'oidc-provider/lib/helpers/defaults.js'
import { getConfig, initializeKeys } from '../../helpers/keys.js'
import Account from '../support/account.js'
import ttl from './ttl.js'

// TODO dynamic features state loading
// TODO dynamic resource server loading
// TODO dynamic cookies config loading
let config = await getConfig()

if (!config) {
  await initializeKeys()
  config = await getConfig()
}

const CORS_PROP = 'urn:f0:ACO'
const isOrigin = (value) => {
  if (typeof value !== 'string') {
    return false
  }
  try {
    const { origin } = new URL(value)
    // Origin: <scheme> "://" <hostname> [ ":" <port> ]
    return value === origin
  } catch (err) {
    return false
  }
}

export default {
  extraClientMetadata: {
    properties: [CORS_PROP],
    validator(ctx, key, value, metadata) {
      if (key === CORS_PROP) {
        // set default (no CORS)
        if (value === undefined) {
          // eslint-disable-next-line no-param-reassign
          metadata[CORS_PROP] = []
          return metadata
        }
        // validate an array of Origin strings
        if (!Array.isArray(value) || !value.every(isOrigin)) {
          throw new errors.InvalidClientMetadata(
            `${CORS_PROP} must be an array of origins`
          )
        }
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
    defaults.renderError(ctx, out, error)
  },
  findAccount: Account.findAccount,
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
    url: (ctx, interaction) => `/interaction/${interaction.uid}`
  },
  cookies: {
    keys: config.cookieKeys
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
    devInteractions: { enabled: false },
    deviceFlow: { enabled: true },
    revocation: { enabled: true },
    clientCredentials: { enabled: true },
    registration: { enabled: true }
  },
  jwks: { keys: config.jwks },
  ttl
}
