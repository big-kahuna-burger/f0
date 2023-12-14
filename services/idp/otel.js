import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import api from '@opentelemetry/api'
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'

// import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { Resource } from '@opentelemetry/resources'
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  SimpleSpanProcessor,
  TraceIdRatioBasedSampler
} from '@opentelemetry/sdk-trace-base'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { readPackageUp } from 'read-package-up'

import instrumentation from '@prisma/instrumentation'

// import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify'
// import { KoaInstrumentation } = '@opentelemetry/instrumentation-koa'
const { PrismaInstrumentation } = instrumentation

if (process.env.OTEL_DIAG) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
}

const { packageJson: pkg } = await readPackageUp()
const contextManager = new AsyncHooksContextManager().enable()

api.context.setGlobalContextManager(contextManager)

const otlpTraceExporter = new OTLPTraceExporter()

const provider = new BasicTracerProvider({
  sampler: process.env.OTEL_SAMPLER
    ? new TraceIdRatioBasedSampler(process.env.OTEL_SAMPLER)
    : undefined,
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: pkg.name,
    [SemanticResourceAttributes.SERVICE_VERSION]: pkg.version
  })
})

if (process.env.OTEL_SAMPLER) {
  provider.addSpanProcessor(new BatchSpanProcessor(otlpTraceExporter))
} else {
  provider.addSpanProcessor(new SimpleSpanProcessor(otlpTraceExporter))
}

// makes the provider the global tracer provider for telemetry
provider.register()

// const ffInstrumentator = new FastifyInstrumentation({
//   requestHook: (span, info) => {
//     span.setAttribute('http.method', info.request.method)
//   }
// })

// const koaInstrumentation = new KoaInstrumentation()
const httpsInstrumentation = new HttpInstrumentation()
const instrumentations = [
  httpsInstrumentation,
  new PrismaInstrumentation({ middleware: true })
  //koaInstrumentation, // this one is broken
  //ffInstrumentator // this one too
]
registerInstrumentations({
  instrumentations
})
