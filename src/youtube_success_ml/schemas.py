from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, ValidationInfo, field_validator


class PredictionRequest(BaseModel):
    uploads: int = Field(..., ge=0, le=2_000_000)
    category: str = Field(..., min_length=1, max_length=100)
    country: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=0, le=100)

    @field_validator("category", "country")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return value.strip()


class PredictionResponse(BaseModel):
    predicted_subscribers: float
    predicted_earnings: float
    predicted_growth: float


class BatchPredictionRequest(BaseModel):
    items: list[PredictionRequest] = Field(..., min_length=1, max_length=500)


class BatchPredictionSummary(BaseModel):
    count: int
    avg_predicted_subscribers: float
    avg_predicted_earnings: float
    avg_predicted_growth: float


class BatchPredictionResponse(BaseModel):
    records: list[PredictionResponse]
    summary: BatchPredictionSummary


class SimulationRequest(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    country: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=0, le=100)
    start_uploads: int = Field(..., ge=0, le=2_000_000)
    end_uploads: int = Field(..., ge=0, le=2_000_000)
    step: int = Field(..., ge=1, le=200_000)

    @field_validator("category", "country")
    @classmethod
    def normalize_sim_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("end_uploads")
    @classmethod
    def end_not_less_than_start(cls, value: int, info: ValidationInfo):
        start = info.data.get("start_uploads")
        if start is not None and value < start:
            raise ValueError("end_uploads must be >= start_uploads")
        return value


class SimulationPoint(PredictionResponse):
    uploads: int


class SimulationResponse(BaseModel):
    input: SimulationRequest
    points: list[SimulationPoint]
    best_uploads_by_growth: int
    best_uploads_by_earnings: int


class RecommendationCluster(BaseModel):
    cluster_id: int
    archetype: str


class RecommendationResponse(BaseModel):
    prediction: PredictionResponse
    cluster: RecommendationCluster
    risk_level: Literal["low", "medium", "high"]
    recommendations: list[str]


class FeatureImportanceRecord(BaseModel):
    feature: str
    importance: float


class FeatureImportanceResponse(BaseModel):
    target: Literal["subscribers", "earnings", "growth"]
    records: list[FeatureImportanceRecord]


class DriftCheckRequest(BaseModel):
    items: list[PredictionRequest] = Field(..., min_length=1, max_length=500)
    z_threshold: float = Field(default=3.0, ge=0.1, le=10.0)
    min_category_frequency: float = Field(default=0.01, ge=0.0, le=1.0)


class DriftRecord(BaseModel):
    index: int
    warnings: list[str]
    severity: Literal["low", "medium", "high"]


class DriftSummary(BaseModel):
    total_records: int
    high_severity_records: int
    is_drift_risk: bool


class DriftCheckResponse(BaseModel):
    summary: DriftSummary
    records: list[DriftRecord]


class HealthResponse(BaseModel):
    status: Literal["ok"]


class ClusterSummaryRecord(BaseModel):
    cluster_id: int
    archetype: str
    size: int
    avg_uploads: float
    avg_subscribers: float
    avg_earnings: float
    avg_growth: float
    dominant_category: str


class CountryMetricRecord(BaseModel):
    country: str
    abbreviation: str
    total_subscribers: float
    total_earnings: float
    dominant_category: str


class MlopsCapabilitiesResponse(BaseModel):
    experiment_tracking: dict[str, bool]
    hpo: dict[str, bool]
    feature_store: dict[str, bool]
    orchestration: dict[str, bool]
    monitoring: dict[str, bool]
