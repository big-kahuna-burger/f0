import path from 'path'
import fs from 'fs/promises'

import api from '@opentelemetry/api'
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'

import { Resource } from '@opentelemetry/resources'
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  SimpleSpanProcessor,
  TraceIdRatioBasedSampler
} from '@opentelemetry/sdk-trace-base'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

import instrumentation from '@prisma/instrumentation'
import desm from 'desm'

const __dirname = desm(import.meta.url)
const packageJsonPath = path.resolve(__dirname, 'package.json')
const packageJsonData = await fs.readFile(packageJsonPath, 'utf8')
const pkg = JSON.parse(packageJsonData)

const { PrismaInstrumentation } = instrumentation

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

provider.register()

const httpsInstrumentation = new HttpInstrumentation()
const instrumentations = [
  httpsInstrumentation,
  new PrismaInstrumentation({ middleware: true })
]
registerInstrumentations({
  instrumentations
})
