const ISSUER = process.env.ISSUER
const url = new URL(ISSUER)
import { F0_TYPE_PROP } from './oidc/client-based-cors/index.js'
import {
  createClientSchema,
  updateClientSchema
} from './passive-plugins/manage-validators.js'
export const swaggerOpts = {
  openapi: {
    info: {
      title: 'Management API',
      version: '1.0.0'
    },
    servers: [
      {
        url: `${url.origin}/manage/v1`
      }
    ],
    paths: {
      '/apps': {
        get: {
          tags: ['Applications'],
          summary: 'List all applications',
          operationId: 'listApplications',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'page',
              required: false
            },
            {
              name: 'size',
              in: 'query',
              description: 'size',
              required: false
            }
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Application'
                    },
                    example: [
                      {
                        client_id: 'MEf-JMGzA5hMpX6dzsJvfg',
                        client_name: 'Dashboard Client (Readonly)',
                        application_type: 'web',
                        grant_types: ['authorization_code', 'refresh_token'],
                        token_endpoint_auth_method: 'none',
                        redirect_uris: [
                          'http://localhost:3036/cb',
                          'http://localhost:9876/documentation/static/oauth2-redirect.html'
                        ],
                        post_logout_redirect_uris: [
                          'http://localhost:3036/cb',
                          'http://localhost:3036/'
                        ],
                        'urn:f0:type': 'spa',
                        updatedAt: '2024-01-02T01:21:01.292Z',
                        readonly: true
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Applications'],
          summary: 'Create an application',
          operationId: 'createApplication',
          requestBody: {
            description: 'Application object that needs to be created',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/requestBodies/CreateApplication',
                  example: {
                    name: 'My App',
                    [F0_TYPE_PROP]: 'spa'
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Application'
                  },
                  example: {
                    client_id: 'MEf-JMGzA5hMpX6dzsJvfg',
                    client_name: 'My App',
                    application_type: 'web',
                    grant_types: ['authorization_code'],
                    token_endpoint_auth_method: 'none',
                    redirect_uris: ['https://myapp.com/cb'],
                    post_logout_redirect_uris: ['https://myapp.com'],
                    'urn:f0:type': 'spa',
                    updatedAt: '2024-01-02T01:21:01.292Z',
                    readonly: false
                  }
                }
              }
            }
          }
        }
      },
      '/app/{id}': {
        get: {
          tags: ['Applications'],
          summary: 'Get an application',
          operationId: 'getApplication',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID of application to return',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Application'
                  },
                  example: {
                    client_id: 'MEf-JMGzA5hMpX6dzsJvfg',
                    client_name: 'Dashboard Client (Readonly)',
                    application_type: 'web',
                    grant_types: ['authorization_code', 'refresh_token'],
                    token_endpoint_auth_method: 'none',
                    redirect_uris: [
                      'http://localhost:3036/cb',
                      'http://localhost:9876/documentation/static/oauth2-redirect.html'
                    ],
                    post_logout_redirect_uris: [
                      'http://localhost:3036/cb',
                      'http://localhost:3036/'
                    ],
                    'urn:f0:type': 'spa',
                    updatedAt: '2024-01-02T01:21:01.292Z',
                    readonly: true,
                    connections: [
                      {
                        id: '062555e0-1e15-4269-98bd-3d33778ce080',
                        name: 'Tenant Members (Readonly)',
                        updatedAt: '2024-01-02T01:21:01.296Z',
                        type: 'DB',
                        readonly: true
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  },
                  example: { error: 'client not found' }
                }
              }
            }
          }
        },
        put: {
          tags: ['Applications'],
          summary: 'Update an application',
          operationId: 'updateApplication',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID of application to update',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            description: 'Application object that needs to be updated',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/requestBodies/UpdateApplication',
                  example: {
                    client_name: 'My APp',
                    'urn:f0:type': 'native',
                    initiate_login_uri: 'https://example.com/login',
                    redirect_uris: ['http://localhost:4567/cb'],
                    post_logout_redirect_uris: [
                      'http://localhost:4567/cb',
                      'http://localhost:8998/'
                    ],
                    logo_uri: 'https://example.com/logo.png'
                  }
                }
              }
            }
          }
        }
      },
      '/connections': {
        security: [
          {
            oAuth2: ['read', 'write']
          }
        ],
        get: {
          tags: ['Connections'],
          summary: 'List all connections',
          operationId: 'listConnections',
          parameters: [],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Connection'
                    },
                    example: [
                      {
                        id: 'a039971e-af01-4395-9f50-6e172314addf',
                        name: 'Tenant Members DB',
                        updatedAt: '2021-07-01T00:00:00.000Z',
                        type: 'DB',
                        readonly: true
                      },
                      {
                        id: '2',
                        name: 'Users DB',
                        updatedAt: '2021-07-01T00:00:00.000Z',
                        type: 'DB',
                        readonly: false
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    },
    security: ['oAuth2'],
    components: {
      schemas: {
        Application: {
          type: 'object',
          properties: {
            client_id: {
              type: 'string'
            },
            client_name: {
              type: 'string'
            },
            client_secret: {
              type: 'string'
            },
            client_secret_expires_at: {
              type: 'number'
            },
            client_uri: {
              type: 'string'
            },
            contacts: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            grant_types: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            id_token_signed_response_alg: {
              type: 'string'
            },
            initiate_login_uri: {
              type: 'string'
            },
            jwks: {
              type: 'object'
            },
            jwks_uri: {
              type: 'string'
            },
            logo_uri: {
              type: 'string'
            },
            owner: {
              type: 'string'
            },
            policy_uri: {
              type: 'string'
            },
            post_logout_redirect_uris: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            redirect_uris: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            request_object_signing_alg: {
              type: 'string'
            },
            request_uris: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            response_types: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            scope: {
              type: 'string'
            },
            sector_identifier_uri: {
              type: 'string'
            },
            subject_type: {
              type: 'string'
            },
            token_endpoint_auth_method: {
              type: 'string'
            },
            tos_uri: {
              type: 'string'
            },
            userinfo_signed_response_alg: {
              type: 'string'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            connections: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Connection'
              }
            }
          }
        },
        Connection: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            type: {
              type: 'string',
              enum: ['DB']
            },
            readonly: {
              type: 'boolean'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            },
            error_description: {
              type: 'string'
            },
            statusCode: {
              type: 'number'
            }
          }
        }
      },
      requestBodies: {
        CreateApplication: {
          ...createClientSchema
        },
        UpdateApplication: {
          ...updateClientSchema
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'UnauthorizedError',
          content: {
            'application/json': {
              ref: '#/components/schemas/Error'
            }
          }
        },
        NotFoundError: {
          description: 'NotFoundError',
          content: {
            'application/json': {
              ref: '#/components/schemas/Error'
            }
          }
        }
      },
      securitySchemes: {
        oAuth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              // clientId: process.env.DASHBOARD_CLIENT_ID,
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
