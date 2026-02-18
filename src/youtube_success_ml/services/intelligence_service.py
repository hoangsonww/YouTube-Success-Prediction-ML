from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from statistics import mean
from typing import Any

from youtube_success_ml.config import MODEL_DIR, REPORT_DIR
from youtube_success_ml.mlops.drift import check_feature_drift, load_training_baseline
from youtube_success_ml.models.clustering import (
    ClusteringBundle,
    load_clustering_bundle,
    predict_kmeans_cluster,
)
from youtube_success_ml.models.supervised import (
    SupervisedBundle,
    batch_predict_from_bundle,
    load_supervised_bundle,
    predict_from_bundle,
    top_feature_importance,
)
from youtube_success_ml.schemas import PredictionRequest, SimulationRequest


@dataclass
class IntelligenceService:
    supervised: SupervisedBundle
    clustering: ClusteringBundle
    baseline: dict[str, Any] | None

    @classmethod
    def from_artifacts(
        cls,
        model_dir: Path | None = None,
        report_dir: Path | None = None,
    ) -> "IntelligenceService":
        model_dir = model_dir or MODEL_DIR
        report_dir = report_dir or REPORT_DIR

        supervised = load_supervised_bundle(model_dir)
        clustering = load_clustering_bundle(model_dir)
        baseline = load_training_baseline(report_dir / "training_baseline.json")
        return cls(supervised=supervised, clustering=clustering, baseline=baseline)

    def predict(self, request: PredictionRequest) -> dict[str, float]:
        return predict_from_bundle(self.supervised, request.model_dump())

    def predict_batch(self, requests: list[PredictionRequest]) -> dict[str, Any]:
        payloads = [r.model_dump() for r in requests]
        records = batch_predict_from_bundle(self.supervised, payloads)

        summary = {
            "count": len(records),
            "avg_predicted_subscribers": float(mean(r["predicted_subscribers"] for r in records)),
            "avg_predicted_earnings": float(mean(r["predicted_earnings"] for r in records)),
            "avg_predicted_growth": float(mean(r["predicted_growth"] for r in records)),
        }
        return {"records": records, "summary": summary}

    def simulate(self, request: SimulationRequest) -> dict[str, Any]:
        rows = []
        for uploads in range(request.start_uploads, request.end_uploads + 1, request.step):
            pred = predict_from_bundle(
                self.supervised,
                {
                    "uploads": uploads,
                    "category": request.category,
                    "country": request.country,
                    "age": request.age,
                },
            )
            rows.append({"uploads": uploads, **pred})

        return {
            "input": request.model_dump(),
            "points": rows,
            "best_uploads_by_growth": max(rows, key=lambda r: r["predicted_growth"])["uploads"],
            "best_uploads_by_earnings": max(rows, key=lambda r: r["predicted_earnings"])["uploads"],
        }

    def recommendation(self, request: PredictionRequest) -> dict[str, Any]:
        pred = self.predict(request)
        cluster_id, archetype = predict_kmeans_cluster(
            self.clustering,
            uploads=float(request.uploads),
            subscribers=pred["predicted_subscribers"],
            earnings=pred["predicted_earnings"],
            growth=pred["predicted_growth"],
        )

        recommendations = []
        if request.uploads < 200:
            recommendations.append(
                "Increase publishing cadence with a consistent weekly release plan."
            )
        if pred["predicted_growth"] < 50_000:
            recommendations.append(
                "Prioritize retention-focused video formats and stronger first-minute hooks."
            )
        if pred["predicted_earnings"] < 1_000_000:
            recommendations.append(
                "Expand monetization mix with sponsorship tiers and affiliate bundles."
            )
        if request.age < 2:
            recommendations.append(
                "Use collaboration and shorts strategy to accelerate early channel discovery."
            )

        if not recommendations:
            recommendations.append(
                "Maintain current content velocity and optimize around top-performing content pillars."
            )

        risk_level = (
            "high"
            if pred["predicted_growth"] < 20_000
            else "medium"
            if pred["predicted_growth"] < 120_000
            else "low"
        )

        return {
            "prediction": pred,
            "cluster": {"cluster_id": cluster_id, "archetype": archetype},
            "risk_level": risk_level,
            "recommendations": recommendations,
        }

    def feature_importance(self, target: str, top_n: int) -> dict[str, Any]:
        return {
            "target": target,
            "records": top_feature_importance(self.supervised, target=target, top_n=top_n),
        }

    def drift_check(
        self, requests: list[PredictionRequest], z_threshold: float, min_frequency: float
    ) -> dict[str, Any]:
        if self.baseline is None:
            raise RuntimeError(
                "Training baseline missing. Retrain pipeline to enable drift checks."
            )
        items = [r.model_dump() for r in requests]
        return check_feature_drift(
            items=items,
            baseline=self.baseline,
            z_threshold=z_threshold,
            min_category_frequency=min_frequency,
        )
