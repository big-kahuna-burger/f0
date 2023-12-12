import { test } from 'vitest'
test('will load OTEL', async (t) => {
  process.env.OTEL_DIAG = 1
  await import('../../otel.js')
})
