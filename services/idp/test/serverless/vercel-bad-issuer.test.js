import { expect, test } from 'vitest'
import '../../env.js'

test('will complain on issuer missing mount path', async (t) => {
  const OLD_ISS = process.env.ISSUER
  process.env.ISSUER = 'https://nomountpath.com'
  const error = await import('../../api/serverless.js').catch((e) => e)
  expect(error.message).toEqual(
    "You should provide a path/prefix for the issuer. Can't mount it to root. In env vars ISSUER=https://mydomain.com/oidc"
  )
  process.env.ISSUER = OLD_ISS
})
