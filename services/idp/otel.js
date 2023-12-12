import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { readPackageUp } from 'read-package-up'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
  BatchSpanProcessor,
  TraceIdRatioBasedSampler
} from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks'
import api from '@opentelemetry/api'
import instrumentation from '@prisma/instrumentation'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { KoaInstrumentation } from '@opentelemetry/instrumentation-koa'
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify'

const { PrismaInstrumentation } = instrumentation
if (process.env.OTEL_DIAG) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const { packageJson: pkg } = await readPackageUp()
// a context manager is required to propagate the context
const contextManager = new AsyncHooksContextManager().enable()

// it's for node.js for span nesting and ctx propagation
api.context.setGlobalContextManager(contextManager)

// a simple exporter that logs the raw data to the console
//   const consoleExporter = new ConsoleSpanExporter()

// exporter that natively works with jaeger without extras
const otlpTraceExporter = new OTLPTraceExporter()

// a standard provider that can run on the web and in node
const provider = new BasicTracerProvider({
  // Enable sampling in production for better performance
  sampler: process.env.OTEL_SAMPLER ? new TraceIdRatioBasedSampler(process.env.OTEL_SAMPLER) : undefined,
  resource: new Resource({
    // we can define some metadata about the trace resource
    [SemanticResourceAttributes.SERVICE_NAME]: pkg.name,
    [SemanticResourceAttributes.SERVICE_VERSION]: pkg.version
  })
})

// provider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter))

if (process.env.OTEL_SAMPLER) {
  provider.addSpanProcessor(new BatchSpanProcessor(otlpTraceExporter))
} else {
  provider.addSpanProcessor(new SimpleSpanProcessor(otlpTraceExporter))
}

// makes the provider the global tracer provider for telemetry
provider.register()

registerInstrumentations({
  instrumentations: [
    new FastifyInstrumentation(), // this one is broken
    new KoaInstrumentation(), // this one is broken
    new HttpInstrumentation(),
    new PrismaInstrumentation(),
  ]
})
