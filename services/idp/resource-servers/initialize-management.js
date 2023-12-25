import prisma from '../db/client.js'
import { MANAGEMENT } from '../resource-servers/management.js'

export async function upsertManagementApiUpdated() {
  const rs = await prisma.resourceServer.findUnique({
    where: { id: 'management' }
  })

  if (!rs) {
    const created = await prisma.resourceServer.create({ data: { ...MANAGEMENT } })
    return created
  }

  const updateResult = await prisma.resourceServer.update({
    where: { id: 'management' },
    data: { scopes: MANAGEMENT.scopes }
  })
  return updateResult
}

upsertManagementApiUpdated()
