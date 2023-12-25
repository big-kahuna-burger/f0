import { fastifyPlugin as fp } from 'fastify-plugin'
import { jwtVerify } from 'jose'

const pluginFn = async (fastify, opts) => {
  const { key = 'jwtVerify', secret, options } = opts

  if (!secret) {
    throw new Error('"KeyLike" secret must be provided. See jose docs')
  }
  
  if (!options || typeof options !== 'object') {
    throw new Error('options must be provided and must be an object')
  }
  
  const { requestExtractor = defaultRequestExtractor, ..._options } = options
  
  if (requestExtractor && typeof requestExtractor !== 'function') {
    throw new Error(
      'options.requestExtractor must be a function taking in a (request)'
    )
  }

  const { algorithms } = _options
  if (!algorithms) {
    throw new Error('options.algorithms must be provided')
  }

  fastify.decorate(key, async function verifyToken(token) {
    const { protectedHeader, payload } = await jwtVerify(token, secret, _options)
    return { protectedHeader, payload }
  })

  fastify.decorateRequest(key, async function requestVerify() {
    const token = await requestExtractor(this)
    if (!token) {
      throw new Error('No token found in request')
    }
    const { protectedHeader, payload } = await fastify.jwtVerify(
      token,
      secret,
      _options
    )
    this.joseResult = { token, protectedHeader, payload }
  })  
}

const pluginOpts = { fastify: '^4.x', name: 'fastify-jose-verify' }
export default fp(pluginFn, pluginOpts)

async function defaultRequestExtractor(request) {
  const authHeader = request?.headers?.authorization
  if (!authHeader) return null
  const [_type, token] = authHeader.split(' ')
  return token
}
