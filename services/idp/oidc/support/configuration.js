import { initializeKeys, getConfig } from '../../../db/helpers/keys.js'
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
  clients: [
    {
      client_id: '528da254-b1f4-4881-9ab3-5dfb98addaf5',
      client_secret: 'GSSmbseznQzFEANOvhbGY',
      grant_types: ['refresh_token', 'authorization_code'],
      redirect_uris: ['http://localhost:3002/cb']
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
    address: ['address'],
    email: ['email', 'email_verified'],
    phone: ['phone_number', 'phone_number_verified'],
    profile: ['birthdate', 'family_name', 'gender', 'given_name', 'locale', 'middle_name', 'name',
      'nickname', 'picture', 'preferred_username', 'profile', 'updated_at', 'website', 'zoneinfo']
  },
  features: {
    devInteractions: { enabled: false },
    deviceFlow: { enabled: true },
    revocation: { enabled: true },
    clientCredentials: { enabled: true }
  },
  jwks: {
    keys: config.jwks
  }
}
