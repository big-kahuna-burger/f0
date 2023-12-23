import { describe, expect, test } from 'vitest'
import { identifier, scopes } from '../../resource-servers/management.js'

describe('read only resource server', () => {
  test('should match expected values based on issuer', () => {
    expect(scopes).toEqual([
      'users:read',
      'users:write',
      'apis:read',
      'apis:write'
    ])
    expect(identifier).toEqual('http://localhost:9876/manage/v1')
  })
})
