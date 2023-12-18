import { describe, expect, test } from 'vitest'
import { getResourceServers } from '../../resource-servers/index.js'
import { rsInfo } from '../../resource-servers/management.js'

describe('resource servers index', () => {
  test('should include readonly in responses', async () => {
    const rss = await getResourceServers()
    expect(rss).toEqual([rsInfo])
  })
})
