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
  'Client', // inactive type = 7 in oidc model, ideally, make tables for each separate model and make this single OIDC model completely obsolete
  // this way I can optimize each table separately, use fields that don't have to stretch across all models
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
    this.modelName = 'default'
    this.model = prisma.oidcModel
    switch (name) {
      case 'Client':
        this.model = prisma.oidcClient
        this.modelName = 'oidcClient'
        break
    }
  }

  async upsert(id, payload, expiresIn) {
    await tracer.startActiveSpan(
      `${this.name}:upsert(id, payload, expiresIn)`,
      async (span) => {
        try {
          let dataArg = {
            type: this.type,
            payload,
            grantId: payload.grantId,
            userCode: payload.userCode,
            uid: payload.uid,
            expiresAt: expiresAt(expiresIn)
          }
          let whereArg = { id_type: { id, type: this.type } }

          switch (this.modelName) {
            case 'oidcClient':
              whereArg = { id }
              dataArg = { payload }
              break
          }
          await this.model.upsert({
            where: whereArg,
            update: { ...dataArg },
            create: { id, ...dataArg }
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
          let whereArg = { id_type: { id, type: this.type } }

          switch (this.modelName) {
            case 'oidcClient':
              whereArg = { id }
              break
          }

          const doc = await this.model.findUnique({ where: whereArg })
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
  // Device Code only
  async findByUserCode(userCode) {
    return new Promise((resolve, reject) => {
      tracer.startActiveSpan(
        `${this.name}:findByUserCode(userCode)`,
        async (span) => {
          try {
            const doc = await this.model.findFirst({ where: { userCode } })

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
  // Session only
  async findByUid(uid) {
    return new Promise((resolve, reject) => {
      tracer.startActiveSpan(`${this.name}:findByUid(uid)`, async (span) => {
        try {
          const doc = await this.model.findFirst({ where: { uid } })

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

  // sl consumables
  async consume(id) {
    await tracer.startActiveSpan(`${this.name}:consume(id)`, async (span) => {
      try {
        const whereArg = { id_type: { id, type: this.type } }
        const data = { consumedAt: new Date() }
        await this.model.update({ where: whereArg, data })
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
        let whereArg = { id_type: { id, type: this.type } }

        switch (this.modelName) {
          case 'oidcClient':
            whereArg = { id }
            break
        }

        await this.model.delete({ where: whereArg })
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
          await this.model.deleteMany({ where: { grantId } })
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
