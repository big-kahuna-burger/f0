import joseVerify from '../../../passive-plugins/jwt-jose.js'

const ACCEPTED_ALGORITHMS = ['ES256', 'RS256']
export default async function managementRouter(fastify, opts) {
  const MANAGEMENT = opts.MANAGEMENT_API
  fastify.register(joseVerify, {
    secret: opts.localKeySet,
    options: {
      issuer: process.env.ISSUER,
      algorithms: ACCEPTED_ALGORITHMS,
      audience: MANAGEMENT.identifier
    }
  })
  fastify.addHook('onRequest', async function onRequest(request, reply) {
    try {
      await request.jwtVerify()
    } catch (error) {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })
}
