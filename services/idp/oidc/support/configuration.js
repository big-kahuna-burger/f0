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

export default {
  async renderError(ctx, out, error) {
    defaults.renderError(ctx, out, error)
  },
  findAccount: Account.findAccount,
  clients: [],
  interactions: { url: (ctx, interaction) => `/interaction/${interaction.uid}` },
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
