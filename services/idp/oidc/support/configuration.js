import Prisma from '@prisma/client'
import { errors } from 'oidc-provider'
import { defaults } from 'oidc-provider/lib/helpers/defaults.js'
import dbClient from '../../db/client.js'
import { MANAGEMENT } from '../../resource-servers/management.js'
import {
  CORS_PROP,
  F0_TYPE_PROP,
  corsPropValidator,
  urnF0TypeValidator
} from '../client-based-cors/index.js'
import TESTER from './tester.js'
import ttl from './ttl.js'
// TODO dynamic features state loading
const { DASHBOARD_CLIENT_ID } = process.env

export default {
  enabledJWA: {
    clientAuthSigningAlgValues: [
      'RS256',
      'RS384',
      'RS512',

      'PS256',
      'PS384',
      'PS512',

      'ES256',
      'ES256K',
      'ES384',
      'ES512',

      'EdDSA',

      'HS256',
      'HS384',
      'HS512'
    ]
  },
  extraParams: ['connection'],
  // TODO dynamic skip consent loading for Resource Servers based on loadExistingGrant
  extraClientMetadata: {
    properties: [CORS_PROP, F0_TYPE_PROP],
    validator(ctx, key, value, metadata) {
      if (key === CORS_PROP) {
        return corsPropValidator(value, metadata) // this can be context aware but not async really
      }
      if (F0_TYPE_PROP === key) {
        return urnF0TypeValidator(value, metadata)
      }
      return metadata
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
  clients: [TESTER],
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
    registration: {
      enabled: true
    }, // deal with open registration
    registrationManagement: { enabled: true }, // deal with open registration
    revocation: { enabled: true },
    claimsParameter: { enabled: true },
    backchannelLogout: { enabled: false },
    ciba: { enabled: false },
    dPoP: { enabled: true },
    encryption: { enabled: true },
    jwtUserinfo: { enabled: true },
    mTLS: { enabled: true },
    introspection: {
      enabled: true,
      allowedPolicy: async (ctx, client, token) => {
        if (
          client.clientAuthMethod === 'none' &&
          token.clientId !== ctx.oidc.client.clientId
        ) {
          return false
        }
        return true
      }
    },
    // jwtIntrospection: { enabled: true },
    // jwtResponseModes: { enabled: true },
    // pushedAuthorizationRequests: { enabled: true },
    // requestObjects: { enabled: true },
    resourceIndicators: {
      enabled: true,
      async defaultResource(ctx, client, oneOf) {
        if (client.clientId === DASHBOARD_CLIENT_ID) {
          return MANAGEMENT.identifier
        }
        return undefined
      },
      getResourceServerInfo,
      useGrantedResource: async (ctx, model) => true
    },
    // introspection: { enabled: true },
    rpInitiatedLogout: { enabled: true },
    // fapi: { enabled: true },
    userinfo: { enabled: true }
  },
  jwks: { keys: [] }, // will be dynamically loaded
  ttl,
  pkce: {
    methods: ['S256'],
    required: function pkceRequired(ctx, client) {
      return client.clientId !== DASHBOARD_CLIENT_ID
    }
  }
}

async function getResourceServerInfo(ctx, resourceIndicator, client) {
  // @param ctx - koa request context
  // @param resourceIndicator - resource indicator value either requested or resolved by the defaultResource helper.
  // @param client - client making the request
  const rs = await dbClient.resourceServer.findFirst({
    where: { identifier: resourceIndicator }
  })
  if (client.clientId === DASHBOARD_CLIENT_ID) {
    return {
      scope: Object.keys(rs.scopes).join(' '),
      audience: resourceIndicator,
      accessTokenTTL: rs.ttlBrowser,
      accessTokenFormat: 'jwt',
      jwt: {
        sign:
          rs.signingAlg === 'HS256'
            ? {
                alg: 'HS256',
                key: rs.signingSecret
              }
            : { alg: 'RS256' }
      }
    }
  }

  const grant = await dbClient.oidcModel.findFirst({
    where: {
      AND: [
        { type: 13 },
        { payload: { path: ['exp'], equals: 0 } },
        { payload: { path: ['clientId'], equals: client.clientId } },
        {
          payload: {
            path: ['resources', resourceIndicator],
            not: Prisma.DbNull
          }
        }
      ]
    }
  })

  if (grant) {
    return {
      scope: grant.payload.resources[resourceIndicator],
      audience: resourceIndicator,
      accessTokenTTL: rs.ttl,
      accessTokenFormat: 'jwt',
      jwt: {
        sign:
          rs.signingAlg === 'HS256'
            ? {
                alg: 'HS256',
                key: rs.signingSecret
              }
            : { alg: 'RS256' }
      }
    }
  }

  throw new errors.InvalidTarget(
    `client "${client.clientId}" is not authorized to access requested "${resourceIndicator}" resource`
  )
}
