import { beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'

beforeEach(() => {
  mockReset(prisma)
})

const prisma = mockDeep({
  fallbackMockImplementation: () => {
    throw new Error('please add expected return value using calledWith')
  }
})
export default prisma