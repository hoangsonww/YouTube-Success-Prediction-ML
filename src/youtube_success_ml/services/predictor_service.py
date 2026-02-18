from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from youtube_success_ml.config import MODEL_DIR
from youtube_success_ml.models.clustering import ClusteringBundle, load_clustering_bundle
from youtube_success_ml.models.supervised import (
    SupervisedBundle,
    load_supervised_bundle,
    predict_from_bundle,
)
from youtube_success_ml.schemas import PredictionRequest


@dataclass
class PredictorService:
    supervised: SupervisedBundle

    @classmethod
    def from_artifacts(cls, model_dir: Path | None = None) -> "PredictorService":
        model_dir = model_dir or MODEL_DIR
        bundle = load_supervised_bundle(model_dir)
        return cls(supervised=bundle)

    def predict(self, request: PredictionRequest) -> dict[str, float]:
        payload = request.model_dump()
        return predict_from_bundle(self.supervised, payload)


@dataclass
class ClusterService:
    clustering: ClusteringBundle

    @classmethod
    def from_artifacts(cls, model_dir: Path | None = None) -> "ClusterService":
        model_dir = model_dir or MODEL_DIR
        bundle = load_clustering_bundle(model_dir)
        return cls(clustering=bundle)

    def summary(self) -> list[dict]:
        return self.clustering.cluster_profiles
