import { describe, expect, test, beforeEach } from 'vitest'

describe('authorization code', () => {
  beforeEach(() => {

  })
  test.each`
  query | location
  ${1} | ${1}
  ${1} | ${1}
  ${1} | ${1}
`('returns $location when $query is used', ({ query, location }) => {
    expect(query).toBe(location)
  })
})
