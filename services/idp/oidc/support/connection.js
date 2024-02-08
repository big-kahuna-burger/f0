import { trace } from '@opentelemetry/api'
import prisma from '../../db/client.js'
const tracer = trace.getTracer('Prisma-Adapter')

class Connection {
  constructor(id, data) {
    this.id = id
    this.data = data
  }
  // async enableClient(clientId) {}
  static async getEnabledConnections(clientId) {
    const args = {
      where: { clientId },
      include: { connection: true }
    }
    const connectionsFound = await prisma.clientConnection.findMany(args)
    return connectionsFound.map((x) => x.connection)
  }
  static async getAllConnections() {
    const connectionsFound = await prisma.connection.findMany()
    return connectionsFound
  }
  static async getSocialConnections() {
    const connectionsFound = await prisma.connection.findMany({
      where: { type: 'SOCIAL' }
    })
    return connectionsFound
  }
  static async getConnectionIdByName(name) {
    const connection = await prisma.connection.findFirst({ where: { name } })
    return connection?.id
  }
}

export { Connection }
