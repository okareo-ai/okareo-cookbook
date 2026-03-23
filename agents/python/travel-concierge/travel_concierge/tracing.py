import os

from openinference.instrumentation.google_adk import GoogleADKInstrumentor
from opentelemetry import trace
from opentelemetry.sdk import trace as trace_sdk
# from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from travel_concierge.httpx_exporter import HttpxSpanExporter


def instrument_adk_with_okareo() -> trace_sdk.TracerProvider:
    """Set up OTEL tracing with Okareo OTLP export,
    using GoogleADKInstrumentor to capture agent, LLM, and tool spans."""
    okareo_base_url = os.getenv("OKAREO_BASE_URL", "")
    okareo_api_key = os.getenv("OKAREO_API_KEY", "")

    otlp_exporter = HttpxSpanExporter(
        endpoint=f"{okareo_base_url}/v1/traces",
        headers={"api-key": okareo_api_key},
    )

    tracer_provider = trace_sdk.TracerProvider()
    tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    # tracer_provider.add_span_processor(SimpleSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(tracer_provider)

    GoogleADKInstrumentor().instrument(tracer_provider=tracer_provider)

    return tracer_provider
