import { trace } from '@opentelemetry/api'
const { OTEL } = process.env

export default (provider) => {
  if (!OTEL) {
    return
  }
  const tracer = trace.getTracer('oidc-provider')
  provider.use(koaActiveSpan)

  async function koaActiveSpan(ctx, next) {
    await tracer.startActiveSpan(
      `${ctx.method} - ${ctx.path}`,
      async (span) => {
        await next()
        span.end()
      }
    )
  }
}
