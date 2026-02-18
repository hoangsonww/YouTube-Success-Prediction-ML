from __future__ import annotations

from fastapi import APIRouter, Query

from youtube_success_ml.api.dependencies import get_service
from youtube_success_ml.schemas import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    FeatureImportanceResponse,
    PredictionRequest,
    PredictionResponse,
    RecommendationResponse,
    SimulationRequest,
    SimulationResponse,
)

router = APIRouter(prefix="/predict", tags=["prediction"])


@router.post("", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    service = get_service()
    result = service.predict(payload)
    return PredictionResponse(**result)


@router.post("/batch", response_model=BatchPredictionResponse)
def predict_batch(payload: BatchPredictionRequest) -> BatchPredictionResponse:
    service = get_service()
    result = service.predict_batch(payload.items)
    return BatchPredictionResponse(**result)


@router.post("/simulate", response_model=SimulationResponse)
def simulate(payload: SimulationRequest) -> SimulationResponse:
    service = get_service()
    result = service.simulate(payload)
    return SimulationResponse(**result)


@router.post("/recommendation", response_model=RecommendationResponse)
def recommendation(payload: PredictionRequest) -> RecommendationResponse:
    service = get_service()
    result = service.recommendation(payload)
    return RecommendationResponse(**result)


@router.get("/feature-importance", response_model=FeatureImportanceResponse)
def feature_importance(
    target: str = Query(default="subscribers", pattern="^(subscribers|earnings|growth)$"),
    top_n: int = Query(default=15, ge=1, le=50),
) -> FeatureImportanceResponse:
    service = get_service()
    result = service.feature_importance(target=target, top_n=top_n)
    return FeatureImportanceResponse(**result)
