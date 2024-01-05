import { F0_TYPE_PROP } from '../oidc/client-based-cors/index.js'

export const updateGrantSchema = {
  $id: 'updateGrant',
  type: 'object',
  properties: {
    scopes: {
      type: 'array',
      items: { type: 'string', minLength: 3, maxLength: 40 },
      minItems: 0,
      maxItems: 128
    },
    identifier: { type: 'string', format: 'uri', minLength: 3, maxLength: 64 }
  },
  required: ['scopes', 'identifier']
}

export const createGrantSchema = {
  $id: 'createGrant',
  type: 'object',
  properties: {
    clientId: { type: 'string', minLength: 3, maxLength: 64 },
    identifier: { type: 'string', format: 'uri', minLength: 3, maxLength: 64 },
    scope: { type: 'string', minLength: 1, maxLength: 256 }
  },
  required: ['clientId', 'identifier']
}

export const updateClientSchema = {
  $id: 'updateClient',
  type: 'object',
  properties: {
    client_name: { type: 'string', minLength: 3, maxLength: 40 },
    'urn:f0:type': { type: 'string', enum: ['native', 'spa', 'web', 'm2m'] },
    initiate_login_uri: { type: 'string', format: 'uri', maxLength: 256 },
    redirect_uris: {
      type: 'array',
      items: { type: 'string', format: 'uri', maxLength: 256 },
      minItems: 0,
      maxItems: 32
    },
    post_logout_redirect_uris: {
      type: 'array',
      items: { type: 'string', format: 'uri', maxLength: 256 },
      minItems: 0,
      maxItems: 32
    },
    logo_uri: { type: 'string', format: 'uri', maxLength: 256 },
    grant_types: {
      type: 'array',
      items: {
        $ref: 'grantType'
      },
      minItems: 0,
      maxItems: 16
    }
  }
}

export const updateClientConnectionSchema = {
  $id: 'updateClientConnection',
  type: 'object',
  properties: {
    id: { type: 'string' },
    connectionId: { type: 'string', format: 'uuid' },
    action: { type: 'string', enum: ['enable', 'disable'] }
  }
}

export const queryClientSchema = {
  $id: 'queryClient',
  type: 'object',
  properties: {
    page: { type: 'number', minimum: 1 },
    size: { type: 'number', minimum: 1, maximum: 1000 },
    grant_types_include: { type: 'string', minLength: 0, maxLength: 256 },
    include: { type: 'string', minLength: 0, maxLength: 256 },
    token_endpoint_auth_method_not: {
      type: 'string',
      minLength: 0,
      maxLength: 256
    }
  }
}

export const queryApisSchema = {
  $id: 'queryApis',
  type: 'object',
  properties: {
    page: { type: 'number', minimum: 1 },
    size: { type: 'number', minimum: 1, maximum: 1000 }
  }
}

export const createClientSchema = {
  $id: 'createClient',
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 40 },
    [F0_TYPE_PROP]: { type: 'string', enum: ['native', 'spa', 'web', 'm2m'] }
  },
  required: ['name', F0_TYPE_PROP]
}

export const apiCreateSchema = {
  $id: 'apiCreate',
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 40 },
    identifier: { type: 'string', minLength: 3, format: 'uri', maxLength: 64 },
    signingAlg: { type: 'string', enum: ['HS256', 'RS256'] }
  },
  required: ['name', 'identifier', 'signingAlg']
}

export const updateScopesSchema = {
  $id: 'updateScopesSchema',
  type: 'object',
  properties: {
    add: {
      type: 'array',
      minItems: 0,
      maxItems: 64,
      items: {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            minLength: 3,
            maxLength: 40
          },
          description: {
            type: 'string',
            minLength: 3,
            maxLength: 40
          }
        },
        required: ['value', 'description']
      }
    },
    remove: {
      type: 'array',
      minItems: 0,
      maxItems: 64,
      items: { type: 'string', minLength: 3, maxLength: 16 }
    }
  },
  required: ['add', 'remove']
}

export const updateApiSchema = {
  $id: 'updateApiSchema',
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 40 },
    ttl: { type: 'number', minimum: 1, maximum: 365.25 * 86400 },
    ttlBrowser: { type: 'number', minimum: 1, maximum: 365.25 * 86400 },
    allowSkipConsent: { type: 'boolean' }
  }
}

export const grantType = {
  $id: 'grantType',
  type: 'string',
  enum: [
    'authorization_code',
    'implicit',
    'refresh_token',
    'client_credentials',
    'urn:ietf:params:oauth:grant-type:device_code'
  ]
}
