import { CodeHighlight } from '@mantine/code-highlight'
import { Stack } from '@mantine/core'
const codeBlock = ({ signingAlg, issuer = 'http://localhost:9876/oidc', audience, secret }) =>
  signingAlg === 'HS256'
    ? `const Fastify = require('fastify')
const fjwt = require('@fastify/jwt')

const fastify = Fastify()
const allowedIss = '${issuer}'
const allowedAud = '${audience}'
const algorithms = ['HS256']

fastify.register(fjwt, {
  verify: {
    allowedIss,
    allowedAud,
    algorithms,
    checkTyp: 'at+jwt'
  },
  secret: '${secret}'
})

fastify.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

fastify.get('/echo-user', async (req, res) => {
  return { user: req.user }
})

fastify.listen({ port: 3042 })
`
: `const Fastify = require('fastify')
const fjwt = require('@fastify/jwt')
const buildGetJwks = require('get-jwks')

const fastify = Fastify()
const getJwks = buildGetJwks({
  jwksPath: '/jwks'
})
const allowedIss = '${issuer}'
const allowedAud = '${audience}'
const algorithms = ['RS256']

fastify.register(fjwt, {
  verify: {
    allowedIss,
    allowedAud,
    algorithms,
    checkTyp: 'at+jwt'
  },
  decode: { complete: true },
  secret: (request, token) => {
    const { header: { kid, alg }, payload: { iss } } = token
    if (iss !== allowedIss) {
      throw new Error('invalid issuer')
    }
    if (!algorithms.includes(alg)) {
      throw new Error('invalid algorithm')
    }
    return getJwks.getPublicKey({ kid, domain: iss, alg })
  }
})

fastify.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

fastify.get('/echo-user', async (req, res) => {
  return { user: req.user }
})

fastify.listen({ port: 3042 })`

const QuickStart = ({ api }) => {
  const cb = codeBlock({
    signingAlg: api.signingAlg,
    secret: api.signingSecret,
    audience: api.identifier,
    issuer: api.issuer
  })
  return (
    <Stack>
      <h1>QuickStart</h1>
      <CodeHighlight code={cb} maw={700} language="js"/>
    </Stack>
  )
}
export default QuickStart
