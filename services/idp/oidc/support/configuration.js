import Prisma from '@prisma/client'
import { errors } from 'oidc-provider'
import { defaults } from 'oidc-provider/lib/helpers/defaults.js'
import dbClient from '../../db/client.js'
import { MANAGEMENT } from '../../resource-servers/management.js'
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
    console.log('renderError', error)
    defaults.renderError(ctx, out, error)
  },
  clients: [
    {
      client_id: 'myClientID',
      client_secret: 'myClientSecret',
      client_name: 'My Client',
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: [
        'http://localhost:3036/cb',
        'http://localhost:9876/documentation/static/oauth2-redirect.html'
      ],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      post_logout_redirect_uris: [],
      [CORS_PROP]: ['http://localhost:3036', 'http://localhost:9876']
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
    introspection: {
      enabled: true,
      allowedPolicy: async (ctx, client, token) => {
        console.log('ALLOWED', client, token, 'END ALLOWED')
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
        // @param ctx - koa request context
        // @param client - client making the request
        // @param oneOf {string[]} - The OP needs to select **one** of the values provided.
        //                           Default is that the array is provided so that the request will fail.
        //                           This argument is only provided when called during
        //                           Authorization Code / Refresh Token / Device Code exchanges.
        console.log('defaultResource', client.clientId, oneOf)
        if (oneOf) return oneOf[0]
        return 'http://localhost:9876/manage/v1'
        // return client.clientId === 'myClientID'
        //   ? 'http://localhost:9876/manage/v1'
        //   : null
      },
      async getResourceServerInfo(ctx, resourceIndicator, client) {
        // @param ctx - koa request context
        // @param resourceIndicator - resource indicator value either requested or resolved by the defaultResource helper.
        // @param client - client making the request
        console.log('getResourceServerInfo', resourceIndicator, client)
        if (resourceIndicator === MANAGEMENT.identifier) {
          if (client.clientId === 'myClientID') {
            console.log(
              'static myClient REQUESTED, allowing everything!',
              client.clientId
            )
            return {
              scope: MANAGEMENT.scopes.join(' '),
              audience: MANAGEMENT.identifier,
              accessTokenTTL: 30 * 60, // 1/2 hours
              accessTokenFormat: 'jwt',
              jwt: {
                sign: { alg: 'ES256' }
              }
            }
          }
          // find grant by client id and a resource indicator identifier/ a audience
        }
        try {
          const grant = await dbClient.oidcModel.findFirst({
            where: {
              AND: [
                {
                  type: 13
                },
                {
                  payload: {
                    path: ['clientId'],
                    equals: client.clientId
                  }
                },
                {
                  payload: {
                    path: ['resources', resourceIndicator],
                    not: Prisma.DbNull
                  }
                },
                {
                  payload: {
                    path: ['exp'],
                    equals: 0
                  }
                }
              ]
            }
          })
          console.log({ grant, ci: client.clientId, resourceIndicator })
          if (grant) {
            return {
              scope: grant.payload.resources[resourceIndicator],
              audience: resourceIndicator,
              accessTokenTTL: 30 * 60,
              accessTokenFormat: 'jwt',
              jwt: {
                sign: { alg: 'ES256' }
              }
            }
          }
        } catch (error) {
          console.log(error)
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
  ttl,
  pkce: {
    methods: ['S256'],
    required: function pkceRequired(ctx, client) {
      return client.clientId !== 'myClientID'
    }
  }
}
