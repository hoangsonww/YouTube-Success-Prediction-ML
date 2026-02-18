from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from youtube_success_ml.mlops.registry import check_artifacts_ready
from youtube_success_ml.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/ready")
def ready():
    status = check_artifacts_ready()
    code = 200 if status["ready"] else 503
    return PlainTextResponse(
        content=(
            "ready\n" if status["ready"] else f"not_ready missing={','.join(status['missing'])}\n"
        ),
        status_code=code,
    )
