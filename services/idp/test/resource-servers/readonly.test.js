import { describe, expect, test } from 'vitest'
import { identifier, scopes } from '../../resource-servers/management.js'

describe('read only resource server', () => {
  test('should match expected values based on issuer', () => {
    expect(scopes).toEqual([
      'read:users',
      'write:users',
      'update:users',
      'delete:users',
      'read:apis',
      'write:apis',
      'update:apis',
      'delete:apis',
      'read:client_grants',
      'write:client_grants',
      'update:client_grants',
      'delete:client_grants'
    ])
    expect(identifier).toEqual('http://localhost:9876/manage/v1')
  })
})
