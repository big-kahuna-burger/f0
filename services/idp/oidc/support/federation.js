import TTLCache from '@isaacs/ttlcache'
import debug from 'debug'
import { Issuer } from 'openid-client'
import { Connection } from './connection.js'
const debugLog = debug('oidc-provider:ext:federation')
const cache = new TTLCache({
  ttl: 1000 * 10,
  dispose: (value, key, reason) => {
    debugLog(`disposing ${key} because ${reason}`)
  }
})

const issuers = new Map()
const clients = new Map()

const {
  ISSUER,
  DEFAULT_GOOGLE_CLIENT_ID,
  DEFAULT_GOOGLE_CLIENT_SECRET,
  DEFAULT_GITHUB_CLIENT_ID,
  DEFAULT_GITHUB_CLIENT_SECRET
} = process.env
const parsed = new URL(ISSUER)
const ISSUER_ORIGIN = parsed.origin
const GOOGLE_CALLBACK = `${ISSUER_ORIGIN}/interaction/callback/google`
const GITHUB_CALLBACK = `${ISSUER_ORIGIN}/interaction/callback/github`

async function loadSocialConnectionsAndCreateClients() {
  const connections = cache.get('sconn') || (await loadSocialConnections())
  for (const connection of connections) {
    if (connection.strategy === 'GOOGLE') {
      let issuer
      if (issuers.has('google')) {
        debugLog('using cached google issuer')
        issuer = issuers.get('google')
      } else {
        debugLog('setting google issuer')
        issuer = await Issuer.discover('https://accounts.google.com')
        issuers.set('google', issuer)
      }
      const googleClient = new issuer.Client({
        client_id:
          connection.connectionConfig.clientId || DEFAULT_GOOGLE_CLIENT_ID,
        client_secret:
          connection.connectionConfig.clientSecret ||
          DEFAULT_GOOGLE_CLIENT_SECRET,
        redirect_uris: [GOOGLE_CALLBACK],
        response_types: ['id_token']
      })
      debugLog('setting google client for ', connection.name)
      clients.set(connection.name, googleClient)
    }
    if (connection.strategy === 'GITHUB') {
      const githubIssuer = new Issuer({
        issuer: 'https://github.com',
        authorization_endpoint: 'https://github.com/login/oauth/authorize',
        token_endpoint: 'https://github.com/login/oauth/access_token',
        userinfo_endpoint: 'https://api.github.com/user'
      })
      const githubClient = new githubIssuer.Client({
        client_id:
          connection.connectionConfig.clientId || DEFAULT_GITHUB_CLIENT_ID,
        client_secret:
          connection.connectionConfig.clientSecret ||
          DEFAULT_GITHUB_CLIENT_SECRET,
        redirect_uris: [GITHUB_CALLBACK],
        response_types: ['code']
      })
      clients.set(connection.name, githubClient)
    }
  }
}

async function loadSocialConnections() {
  const connections = await Connection.getSocialConnections()
  cache.set('sconn', connections)
  return connections
}

export async function getFederationClients() {
  await loadSocialConnectionsAndCreateClients()
  return Object.fromEntries(clients.entries())
}
