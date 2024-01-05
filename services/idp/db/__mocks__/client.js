import { beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'

beforeEach(() => {
  mockReset(prisma)
})

const prisma = mockDeep({
  fallbackMockImplementation: (...args) => {
    console.error('fallback mock called with', args)
    throw new Error('please add mock implementation')
  }
})

export default prisma
