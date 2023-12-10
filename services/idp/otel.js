import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
  BatchSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import * as api from "@opentelemetry/api";
import instrumentation from '@prisma/instrumentation'
const { PrismaInstrumentation } = instrumentation;
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import pkg from './package.json' assert { type: 'json' }
export function otelSetup() {
  // a context manager is required to propagate the context
  const contextManager = new AsyncHooksContextManager().enable();

  // it's for node.js for span nesting and ctx propagation
  api.context.setGlobalContextManager(contextManager);

  // a simple exporter that logs the raw data to the console
  //   const consoleExporter = new ConsoleSpanExporter()

  // exporter that natively works with jaeger without extras
  const otlpTraceExporter = new OTLPTraceExporter();

  // a standard provider that can run on the web and in node
  const provider = new BasicTracerProvider({
    // Enable sampling in production for better performance
    // sampler: new TraceIdRatioBasedSampler(0.1),
    resource: new Resource({
      // we can define some metadata about the trace resource
      [SemanticResourceAttributes.SERVICE_NAME]: pkg.name,
      [SemanticResourceAttributes.SERVICE_VERSION]: pkg.version,
    }),
  });

  // provider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter))

  if (process.env.NODE_ENV === "production") {
    provider.addSpanProcessor(new BatchSpanProcessor(otlpTraceExporter));
  } else {
    provider.addSpanProcessor(new SimpleSpanProcessor(otlpTraceExporter));
  }

  // makes the provider the global tracer provider for telemetry
  provider.register();

  registerInstrumentations({
    instrumentations: [
      new PrismaInstrumentation(),
      getNodeAutoInstrumentations()
    ],
    
  });
  console.log('configured OTEL')
}