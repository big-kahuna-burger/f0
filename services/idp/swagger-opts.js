const ISSUER = process.env.ISSUER
const url = new URL(ISSUER)
import { F0_TYPE_PROP } from './oidc/client-based-cors/index.js'
import {
  apiCreateSchema,
  createClientSchema,
  createGrantSchema,
  updateApiSchema,
  updateClientSchema,
  updateGrantSchema,
  updateScopesSchema
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
      '/apis': {
        get: {
          tags: ['APIs'],
          summary: 'List all APIs',
          operationId: 'listApis',
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
                      $ref: '#/components/schemas/API'
                    },
                    example: [
                      {
                        id: 'management',
                        name: 'Management API (Readonly).  ',
                        identifier: 'http://localhost:9876/manage/v1',
                        signingAlg: 'RS256',
                        scopes: {
                          'read:apis': 'Read APIs',
                          'read:users': 'Read Application Users',
                          'write:apis': 'Create APIs',
                          'delete:apis': 'Delete APIs',
                          'update:apis': 'Update APIs',
                          'write:users': 'Create Application Users',
                          'delete:users': 'Delete Application Users',
                          'update:users': 'Update Application Users',
                          'read:client_grants': 'Read Client Grants',
                          'write:client_grants': 'Create Client Grants',
                          'delete:client_grants': 'Delete Client Grants',
                          'update:client_grants': 'Update Client Grants'
                        },
                        updatedAt: '2024-01-04T13:45:24.852Z',
                        ttl: 86400,
                        ttlBrowser: 7200,
                        allowSkipConsent: true,
                        readOnly: true,
                        signingSecret: null
                      },
                      {
                        id: 'fc648da1-7d0e-416f-91ee-766d4fc3c742',
                        name: 'adsadsa',
                        identifier: 'https://abc.hogo',
                        signingAlg: 'RS256',
                        scopes: [],
                        updatedAt: '2024-01-02T14:54:19.307Z',
                        ttl: 86400,
                        ttlBrowser: 7200,
                        allowSkipConsent: false,
                        readOnly: false,
                        signingSecret: null
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['APIs'],
          summary: 'Create an API',
          operationId: 'createApi',
          requestBody: {
            description: 'API object that needs to be created',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/requestBodies/CreateApi',
                  example: {
                    name: 'My API',
                    identifier: 'https://myapi.com',
                    signingAlg: 'RS256'
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
                    $ref: '#/components/schemas/API'
                  },
                  example: {
                    id: '77d65217-c6d6-47c6-82e6-b79d47c05110',
                    name: 'My API',
                    identifier: 'https://myapi.com',
                    signingAlg: 'RS256',
                    scopes: [],
                    updatedAt: '2024-01-04T21:53:02.506Z',
                    ttl: 86400,
                    ttlBrowser: 7200,
                    allowSkipConsent: false,
                    readOnly: false,
                    signingSecret: null
                  }
                }
              }
            },
            409: {
              description: 'Conflict',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  },
                  example: {
                    error:
                      'resource indicator "https://myapi.com" is already registered with oidc server'
                  }
                }
              }
            }
          }
        }
      },
      '/api/{id}': {
        get: {
          tags: ['APIs'],
          summary: 'Get an API',
          operationId: 'getApi',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID of API to return',
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
                    $ref: '#/components/schemas/API'
                  },
                  example: {
                    id: '77d65217-c6d6-47c6-82e6-b79d47c05110',
                    name: 'My API',
                    identifier: 'https://myapi.com',
                    signingAlg: 'RS256',
                    scopes: [],
                    updatedAt: '2024-01-04T21:53:02.506Z',
                    ttl: 86400,
                    ttlBrowser: 7200,
                    allowSkipConsent: false,
                    readOnly: false,
                    signingSecret: null
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
                  example: { error: 'resource server not found' }
                }
              }
            }
          }
        },
        put: {
          tags: ['APIs'],
          summary: 'Update an API',
          operationId: 'updateApi',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID of API to update',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            description: 'API object that needs to be updated',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/requestBodies/UpdateApi',
                  example: {
                    name: 'My API',
                    ttl: 86400,
                    ttlBrowser: 7200,
                    allowSkipConsent: false
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/API'
                  },
                  example: {
                    id: '77d65217-c6d6-47c6-82e6-b79d47c05110',
                    name: 'My API',
                    identifier: 'https://myapi.com',
                    signingAlg: 'RS256',
                    scopes: [],
                    updatedAt: '2024-01-04T21:53:02.506Z',
                    ttl: 86400,
                    ttlBrowser: 7200,
                    allowSkipConsent: false,
                    readOnly: false,
                    signingSecret: null
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
                  example: { error: 'resource server not found' }
                }
              }
            }
          }
        }
      },
      '/api/{id}/scopes': {
        put: {
          tags: ['APIs'],
          summary: 'Update scopes of an API',
          operationId: 'updateApiScopes',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID of API to update',
              required: true
            }
          ],
          requestBody: {
            description: 'Scopes object that needs to be updated',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/requestBodies/UpdateScopes',
                  example: {
                    add: [
                      {
                        value: 'read:users',
                        description: 'Read Application Users'
                      }
                    ],
                    remove: ['read:apis']
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/API'
                  },
                  example: {
                    id: '77d65217-c6d6-47c6-82e6-b79d47c05110',
                    name: 'My API',
                    identifier: 'https://myapi.com',
                    signingAlg: 'RS256',
                    scopes: {
                      'read:users': 'Read Application Users'
                    },
                    updatedAt: '2024-01-04T21:53:02.506Z',
                    ttl: 86400,
                    ttlBrowser: 7200,
                    allowSkipConsent: false,
                    readOnly: false,
                    signingSecret: null
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
                  example: { error: 'resource server not found' }
                }
              }
            }
          }
        }
      },
      '/api/{id}/grants': {
        get: {
          tags: ['APIs', 'Grants'],
          summary: 'List all grants of an API',
          operationId: 'listApiGrants',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID of API to return',
              required: true,
              schema: {
                type: 'string'
              }
            },
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
                      $ref: '#/components/schemas/Grant'
                    },
                    example: [
                      {
                        grantId:
                          'RI-i-D1lR8VmJS6hhVzwqnHShgP2RqnBzf_dPiuR61hM8R',
                        clientId: 'w_OwN9Hn0QWnQT8tb2g7E',
                        scopes: [
                          'read:apis',
                          'read:users',
                          'write:apis',
                          'delete:apis',
                          'update:apis',
                          'write:users',
                          'delete:users',
                          'update:users',
                          'read:client_grants',
                          'write:client_grants',
                          'delete:client_grants',
                          'update:client_grants'
                        ]
                      },
                      {
                        grantId:
                          'RI-V3-kkwZVvoolM_MuePzNj5-8hd0q9okQHaUrM16OG46',
                        clientId: 'DH9Y23c4esT35HH-g0WsE',
                        scopes: []
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
                  example: { error: 'resource server not found' }
                }
              }
            }
          }
        }
      },
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
      },
      '/grants': {
        post: {
          tags: ['Grants'],
          summary: 'Create a grant',
          operationId: 'createGrant',
          requestBody: {
            description: 'Grant object that needs to be created',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/requestBodies/CreateGrant',
                  example: {
                    clientId: 'MEf-JMGzA5hMpX6dzsJvfg',
                    identifier: 'https://myapi.com',
                    scope: 'read:apis read:users'
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
                    $ref: '#/components/schemas/Grant'
                  },
                  example: {
                    grantId: 'RI-i-D1lR8VmJS6hhVzwqnHShgP2RqnBzf_dPiuR61hM8R',
                    clientId: 'w_OwN9Hn0QWnQT8tb2g7E',
                    scopes: ['read:apis', 'read:users']
                  }
                }
              }
            },
            409: {
              description: 'Conflict',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  },
                  example: {
                    error: 'client grant already exists'
                  }
                }
              }
            }
          }
        }
      },
      '/grants/{id}': {
        put: {
          tags: ['Grants'],
          summary: 'Update a grant',
          operationId: 'updateGrant',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID of grant to update',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            description: 'Grant object that needs to be updated',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/requestBodies/UpdateGrant',
                  example: {
                    identifier: 'http://localhost:9876/manage/v1',
                    scopes: ['read:apis', 'read:users']
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Grant'
                  },
                  example: {
                    grantId: 'RI-i-D1lR8VmJS6hhVzwqnHShgP2RqnBzf_dPiuR61hM8R',
                    clientId: 'w_OwN9Hn0QWnQT8tb2g7E',
                    scopes: ['read:apis', 'read:users']
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
                  example: { error: 'client grant not found' }
                }
              }
            },
            409: {
              description: 'Conflict',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  },
                  example: {
                    error: 'client grant already exists'
                  }
                }
              }
            },
            422: {
              description: 'Unprocessable Entity',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  },
                  example: {
                    error: 'invalid identifier'
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
        API: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            identifier: {
              type: 'string'
            },
            signingAlg: {
              type: 'string'
            },
            scopes: {
              type: 'object'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            ttl: {
              type: 'number'
            },
            ttlBrowser: {
              type: 'number'
            },
            allowSkipConsent: {
              type: 'boolean'
            },
            readOnly: {
              type: 'boolean'
            },
            signingSecret: {
              type: 'string'
            }
          }
        },
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
        Grant: {
          type: 'object',
          properties: {
            grantId: {
              type: 'string'
            },
            clientId: {
              type: 'string'
            },
            scopes: {
              type: 'array',
              items: {
                type: 'string'
              }
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
        },
        CreateApi: {
          ...apiCreateSchema
        },
        UpdateApi: {
          ...updateApiSchema
        },
        UpdateScopes: {},
        CreateGrant: {
          ...createGrantSchema
        },
        UpdateGrant: {
          ...updateGrantSchema
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
