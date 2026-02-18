from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from youtube_success_ml.api.dependencies import (
    get_service,
    request_count_by_path,
    request_latency_sum_by_path,
)
from youtube_success_ml.mlops.registry import load_manifest, load_registry
from youtube_success_ml.schemas import DriftCheckRequest, DriftCheckResponse

router = APIRouter(tags=["mlops"])


@router.get("/mlops/manifest")
def manifest():
    data = load_manifest()
    if data is None:
        raise HTTPException(status_code=404, detail="Manifest not found")
    return data


@router.get("/mlops/registry")
def registry():
    data = load_registry()
    if data is None:
        raise HTTPException(status_code=404, detail="Registry not found")
    return data


@router.post("/mlops/drift-check", response_model=DriftCheckResponse)
def drift_check(payload: DriftCheckRequest) -> DriftCheckResponse:
    service = get_service()
    try:
        result = service.drift_check(
            requests=payload.items,
            z_threshold=payload.z_threshold,
            min_frequency=payload.min_category_frequency,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return DriftCheckResponse(**result)


@router.get("/metrics", response_class=PlainTextResponse)
def metrics():
    lines = [
        "# HELP http_requests_total Total number of requests by path",
        "# TYPE http_requests_total counter",
    ]
    for path in sorted(request_count_by_path):
        lines.append(f'http_requests_total{{path="{path}"}} {request_count_by_path[path]}')

    lines.extend(
        [
            "# HELP http_request_latency_seconds_sum Cumulative request latency by path",
            "# TYPE http_request_latency_seconds_sum counter",
        ]
    )
    for path in sorted(request_latency_sum_by_path):
        lines.append(
            f'http_request_latency_seconds_sum{{path="{path}"}} {request_latency_sum_by_path[path]:.6f}'
        )
    return "\n".join(lines) + "\n"
