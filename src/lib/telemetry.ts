import {
    WebTracerProvider,
    BatchSpanProcessor,
    SimpleSpanProcessor,
    ConsoleSpanExporter,
    SpanProcessor,
} from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { trace, SpanStatusCode, Span } from '@opentelemetry/api';

let initialized = false;

export function initTelemetry() {
    if (initialized || typeof window === 'undefined') return;

    const otlpEndpoint = process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT;

    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'typer-racer',
        [ATTR_SERVICE_VERSION]: '1.0.0',
        'deployment.environment': process.env.NODE_ENV || 'development',
    });

    const spanProcessors: SpanProcessor[] = [];

    // Only add OTLP exporter if endpoint is configured
    if (otlpEndpoint) {
        const exporter = new OTLPTraceExporter({
            url: `${otlpEndpoint}/v1/traces`,
        });
        spanProcessors.push(new BatchSpanProcessor(exporter));
    }

    // Console exporter for development
    if (process.env.NODE_ENV === 'development') {
        spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
    }

    const provider = new WebTracerProvider({ resource, spanProcessors });

    provider.register({
        contextManager: new ZoneContextManager(),
    });

    registerInstrumentations({
        instrumentations: [
            new FetchInstrumentation({
                // Only propagate trace headers to our own backend, not third-party services like Clerk
                propagateTraceHeaderCorsUrls: [
                    /localhost/,
                    /vercel\.app\/api/,
                    /convex\.cloud/,
                ],
                clearTimingResources: true,
            }),
            new DocumentLoadInstrumentation(),
        ],
    });

    initialized = true;
    console.log('[OTel] Telemetry initialized');
}

// Get tracer for custom spans
export function getTracer() {
    return trace.getTracer('typer-racer', '1.0.0');
}

// Helper to create a span for race events
export function traceRaceEvent(
    name: string,
    attributes?: Record<string, string | number | boolean>
): Span {
    const tracer = getTracer();
    const span = tracer.startSpan(`race.${name}`, {
        attributes: {
            'race.event': name,
            ...attributes,
        },
    });
    return span;
}

// Helper to trace async operations
export async function traceAsync<T>(
    name: string,
    fn: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> {
    const span = traceRaceEvent(name, attributes);
    try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    } catch (error) {
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    } finally {
        span.end();
    }
}

// Pre-built race event tracers
export const raceTracer = {
    startRace: (userId?: string) => {
        const span = traceRaceEvent('start', { 'user.id': userId || 'anonymous' });
        return () => span.end();
    },

    finishRace: (wpm: number, accuracy: number, userId?: string) => {
        const span = traceRaceEvent('finish', {
            'race.wpm': wpm,
            'race.accuracy': accuracy,
            'user.id': userId || 'anonymous',
        });
        span.end();
    },

    keystroke: (correct: boolean, character: string) => {
        const span = traceRaceEvent('keystroke', {
            'keystroke.correct': correct,
            'keystroke.character': character,
        });
        span.end();
    },

    saveScore: (wpm: number) => {
        return traceRaceEvent('save_score', { 'race.wpm': wpm });
    },
};
