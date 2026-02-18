from __future__ import annotations

import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from youtube_success_ml.api.dependencies import track_request
from youtube_success_ml.api.routers import (
    analytics_router,
    health_router,
    mlops_router,
    predictions_router,
)


def create_app() -> FastAPI:
    app = FastAPI(title="YouTube Success ML API", version="2.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def telemetry_middleware(request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start
        track_request(request.url.path, elapsed)
        response.headers["X-Process-Time-Seconds"] = f"{elapsed:.6f}"
        return response

    app.include_router(health_router)
    app.include_router(predictions_router)
    app.include_router(analytics_router)
    app.include_router(mlops_router)
    return app


app = create_app()
