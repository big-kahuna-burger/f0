import { PrismaClient } from '@prisma/client'
import debug from 'debug'
const dbg = debug('prisma:events')

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query'
    }
  ]
})

prisma.$on('query', (e) => {
  dbg(`Query: ${e.query}`)
  dbg(`Params: ${e.params}`)
  dbg(`Duration: ${e.duration}ms`)
})

export default prisma
