import os

from openinference.instrumentation.google_adk import GoogleADKInstrumentor
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk import trace as trace_sdk
from opentelemetry.sdk.trace.export import SimpleSpanProcessor


def instrument_adk_with_okareo() -> trace_sdk.TracerProvider:
    """Set up OTEL tracing with Okareo OTLP export,
    using GoogleADKInstrumentor to capture agent, LLM, and tool spans."""
    okareo_base_url = os.getenv("OKAREO_BASE_URL", "")
    okareo_api_key = os.getenv("OKAREO_API_KEY", "")

    otlp_exporter = OTLPSpanExporter(
        endpoint=f"{okareo_base_url}/v1/traces",
        headers={"api-key": okareo_api_key},
    )

    tracer_provider = trace_sdk.TracerProvider()
    tracer_provider.add_span_processor(SimpleSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(tracer_provider)

    GoogleADKInstrumentor().instrument(tracer_provider=tracer_provider)

    return tracer_provider
