import { trace } from '@opentelemetry/api'
import prisma from '../../db/client.js'

const tracer = trace.getTracer('Prisma-Adapter')

const types = [
  'Session',
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'ClientCredentials',
  'Client',
  'InitialAccessToken',
  'RegistrationAccessToken',
  'Interaction',
  'ReplayDetection',
  'PushedAuthorizationRequest',
  'Grant',
  'BackchannelAuthenticationRequest'
].reduce((map, name, i) => {
  map[name] = i + 1
  return map
}, {})

const prepare = (doc) => {
  const isPayloadJson =
    doc.payload &&
    typeof doc.payload === 'object' &&
    !Array.isArray(doc.payload)

  const payload = isPayloadJson ? doc.payload : {}

  const returning = {
    ...payload,
    ...(doc.consumedAt ? { consumed: true } : undefined)
  }
  return returning
}

const expiresAt = (expiresIn) =>
  expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

class PrismaAdapter {
  type

  constructor(name) {
    this.name = name
    this.type = types[name]
  }

  async upsert(id, payload, expiresIn) {
    await tracer.startActiveSpan(
      `${this.name}:upsert(id, payload, expiresIn)`,
      async (span) => {
        try {
          const data = {
            type: this.type,
            payload: { ...payload },
            grantId: payload.grantId,
            userCode: payload.userCode,
            uid: payload.uid,
            expiresAt: expiresAt(expiresIn)
          }
          await prisma.oidcModel.upsert({
            where: {
              id_type: {
                id,
                type: this.type
              }
            },
            update: {
              ...data
            },
            create: {
              id,
              ...data
            }
          })
        } catch (error) {
          span.recordException(error)
        } finally {
          span.end()
        }
      }
    )
  }

  async find(id) {
    return new Promise((resolve, reject) => {
      tracer.startActiveSpan(`${this.name}:find(id)`, async (span) => {
        try {
          const doc = await prisma.oidcModel.findUnique({
            where: {
              id_type: {
                id,
                type: this.type
              }
            }
          })

          if (!doc || (doc.expiresAt && doc.expiresAt < new Date())) {
            return resolve(undefined)
          }
          return resolve(prepare(doc))
        } catch (error) {
          span.recordException(error)
          return reject(error)
        } finally {
          span.end()
        }
      })
    })
  }

  async findByUserCode(userCode) {
    return new Promise((resolve, reject) => {
      tracer.startActiveSpan(
        `${this.name}:findByUserCode(userCode)`,
        async (span) => {
          try {
            const doc = await prisma.oidcModel.findFirst({
              where: {
                userCode
              }
            })

            if (!doc || (doc.expiresAt && doc.expiresAt < new Date())) {
              return resolve(undefined)
            }
            return resolve(prepare(doc))
          } catch (error) {
            span.recordException(error)
            return reject(error)
          } finally {
            span.end()
          }
        }
      )
    })
  }

  async findByUid(uid) {
    return new Promise((resolve, reject) => {
      tracer.startActiveSpan(`${this.name}:findByUid(uid)`, async (span) => {
        try {
          const doc = await prisma.oidcModel.findFirst({
            where: {
              uid
            }
          })

          if (!doc || (doc.expiresAt && doc.expiresAt < new Date())) {
            return resolve(undefined)
          }
          return resolve(prepare(doc))
        } catch (error) {
          span.recordException(error)
          return reject(error)
        } finally {
          span.end()
        }
      })
    })
  }

  async consume(id) {
    await tracer.startActiveSpan(`${this.name}:consume(id)`, async (span) => {
      try {
        await prisma.oidcModel.update({
          where: {
            id_type: {
              id,
              type: this.type
            }
          },
          data: {
            consumedAt: new Date()
          }
        })
      } catch (error) {
        span.recordException(error)
      } finally {
        span.end()
      }
    })
  }

  async destroy(id) {
    await tracer.startActiveSpan(`${this.name}:destroy(id)`, async (span) => {
      try {
        await prisma.oidcModel.delete({
          where: {
            id_type: {
              id,
              type: this.type
            }
          }
        })
      } catch (error) {
        span.recordException(error)
      } finally {
        span.end()
      }
    })
  }

  async revokeByGrantId(grantId) {
    await tracer.startActiveSpan(
      `${this.name}:revokeByGrantId(grantId)`,
      async (span) => {
        try {
          await prisma.oidcModel.deleteMany({
            where: {
              grantId
            }
          })
        } catch (error) {
          span.recordException(error)
        } finally {
          span.end()
        }
      }
    )
  }
}

export default PrismaAdapter
