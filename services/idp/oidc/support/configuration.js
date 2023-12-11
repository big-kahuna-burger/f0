import { initializeKeys, getConfig } from '../../../db/helpers/keys.js'
import Account from '../support/account.js'
import { defaults } from 'oidc-provider/lib/helpers/defaults.js'
import ttl from './ttl.js'
// TODO devInteractions disable
// TODO interactions implement
// TODO dynamic features state loading
// TODO dynamic resource server loading
// TODO dynamic cookies config loading
let config = await getConfig()

if (!config) {
  await initializeKeys()
  config = await getConfig()
}

export default {
  async renderError (ctx, out, error) {
    console.error(out, error)
    defaults.renderError(ctx, out, error)
  },
  findAccount: Account.findAccount,
  clients: [
    {
      client_id: '528da254-b1f4-4881-9ab3-5dfb98addaf5',
      client_secret: 'GSSmbseznQzFEANOvhbGY',
      grant_types: ['refresh_token', 'authorization_code'],
      redirect_uris: ['http://localhost:3002/cb', 'https://somerp.com/cb'],
      token_endpoint_auth_method: 'none'
    },
    {
      client_id: '228da254-b1f4-4881-9ab3-5dfb98addaf5',
      client_secret: 'GSSmbseznQzFEANOvhbGY',
      grant_types: ['client_credentials'],
      redirect_uris: [],
      response_types: []
    }
  ],
  interactions: {
    url (ctx, interaction) { // eslint-disable-line no-unused-vars
      return `/interaction/${interaction.uid}`
    }
  },
  cookies: {
    keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more']
  },
  claims: {
    openid: ['sub'],
    address: ['address'],
    email: ['email', 'email_verified'],
    phone: ['phone_number', 'phone_number_verified'],
    profile: ['birthdate', 'family_name', 'gender', 'given_name', 'locale', 'middle_name', 'name',
      'nickname', 'picture', 'preferred_username', 'profile', 'updated_at', 'website', 'zoneinfo']
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
