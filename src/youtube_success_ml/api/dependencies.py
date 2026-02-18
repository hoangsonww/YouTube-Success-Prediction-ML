from __future__ import annotations

import time
from collections import defaultdict

from fastapi import HTTPException

from youtube_success_ml.services.intelligence_service import IntelligenceService

request_count_by_path: dict[str, int] = defaultdict(int)
request_latency_sum_by_path: dict[str, float] = defaultdict(float)

_service: IntelligenceService | None = None


def track_request(path: str, elapsed_seconds: float) -> None:
    request_count_by_path[path] += 1
    request_latency_sum_by_path[path] += elapsed_seconds


def get_service() -> IntelligenceService:
    global _service
    if _service is None:
        try:
            _service = IntelligenceService.from_artifacts()
        except FileNotFoundError as exc:
            raise HTTPException(status_code=503, detail="Model artifacts unavailable") from exc
    return _service


def invalidate_service_cache() -> None:
    global _service
    _service = None
