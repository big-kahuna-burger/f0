import { describe, expect, test } from 'vitest'
import { getReadOnlyRServer } from '../../resource-servers/index.js'
import { rsInfo } from '../../resource-servers/management.js'

describe('resource servers index', () => {
  test('should include readonly in responses', async () => {
    const rss = await getReadOnlyRServer()
    expect(rss).toEqual(rsInfo)
  })
})
