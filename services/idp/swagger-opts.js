export const swaggerOpts = {
  openapi: {
    info: {
      title: 'Management API',
      description: 'Use to test mgmt api v1',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:9876'
      }
    ],
    components: {
      securitySchemes: {
        oidc: {
          type: 'openIdConnect',
          openIdConnectUrl: 'http://localhost:9876/oidc/.well-known/openid-configuration',
          description: 'OpenID Connect'
          
        }
      }
    }
  },
  hideUntagged: true,
  exposeRoute: true
}
