import { describe, expect, test } from 'vitest'
import { identifier, scopes } from '../../resource-servers/management.js'

describe('read only resource server', () => {
  test('should match expected values based on issuer', () => {
    expect(scopes).toEqual([])
    expect(identifier).toEqual('http://idp.dev:9876/manage/v1')
  })
})
