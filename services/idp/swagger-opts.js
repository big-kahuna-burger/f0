const ISSUER = process.env.ISSUER
const url = new URL(ISSUER)
export const swaggerOpts = {
  openapi: {
    info: {
      title: 'Management API',
      description: 'Use to test mgmt api v1',
      version: '1.0.0'
    },
    servers: [
      {
        url: url.origin
      }
    ],
    components: {
      securitySchemes: {
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              clientId: process.env.DASHBOARD_CLIENT_ID,
              authorizationUrl: `${ISSUER}/auth`,
              tokenUrl: `${ISSUER}/token`,
              scopes: {
                openid: 'openid',
                profile: 'profile',
                email: 'email',
                offline_access: 'offline_access'
              }
            }
          }
        }
      }
    }
  },
  hideUntagged: true,
  exposeRoute: true
}
