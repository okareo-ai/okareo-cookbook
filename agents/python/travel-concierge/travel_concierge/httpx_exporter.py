import asyncio
import logging
import threading
from typing import Sequence

import httpx
from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
    encode_spans,
)
from opentelemetry.sdk.trace import ReadableSpan
from opentelemetry.sdk.trace.export import SpanExporter, SpanExportResult

logger = logging.getLogger(__name__)


class HttpxSpanExporter(SpanExporter):
    """Non-blocking OTLP/HTTP span exporter using httpx.AsyncClient.

    Runs a dedicated event loop in a daemon thread so that export()
    never blocks the calling thread on network I/O.
    """

    def __init__(
        self,
        endpoint: str,
        headers: dict[str, str] | None = None,
        timeout: float = 10.0,
    ):
        self._endpoint = endpoint
        self._headers = {
            "content-type": "application/x-protobuf",
            **(headers or {}),
        }
        self._timeout = timeout
        self._shutdown = False

        self._loop = asyncio.new_event_loop()
        self._thread = threading.Thread(
            target=self._loop.run_forever, daemon=True, name="otel-httpx-exporter"
        )
        self._thread.start()
        self._client: httpx.AsyncClient = asyncio.run_coroutine_threadsafe(
            self._create_client(), self._loop
        ).result()

    async def _create_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            headers=self._headers,
            timeout=httpx.Timeout(self._timeout),
        )

    async def _send(self, data: bytes) -> None:
        try:
            resp = await self._client.post(self._endpoint, content=data)
            if not resp.is_success:
                logger.warning(
                    "OTLP export failed: %s %s", resp.status_code, resp.text[:200]
                )
        except Exception:
            logger.debug("OTLP export error", exc_info=True)

    def export(self, spans: Sequence[ReadableSpan]) -> SpanExportResult:
        if self._shutdown:
            return SpanExportResult.FAILURE

        data = encode_spans(spans).SerializePartialToString()
        # Fire-and-forget: schedule the POST on the background loop
        asyncio.run_coroutine_threadsafe(self._send(data), self._loop)
        return SpanExportResult.SUCCESS

    def shutdown(self) -> None:
        self._shutdown = True
        try:
            asyncio.run_coroutine_threadsafe(
                self._client.aclose(), self._loop
            ).result(timeout=5)
        except Exception:
            pass
        self._loop.call_soon_threadsafe(self._loop.stop)
        self._thread.join(timeout=5)

    def force_flush(self, timeout_millis: int = 30000) -> bool:
        return True
