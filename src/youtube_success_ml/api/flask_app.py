from __future__ import annotations

import numpy as np
from flask import Flask, jsonify, request

from youtube_success_ml.data.loader import load_dataset, load_raw_dataset
from youtube_success_ml.mlops.registry import check_artifacts_ready, load_manifest, load_registry
from youtube_success_ml.schemas import (
    BatchPredictionRequest,
    DriftCheckRequest,
    PredictionRequest,
    SimulationRequest,
)
from youtube_success_ml.services.intelligence_service import IntelligenceService
from youtube_success_ml.visualization.maps import build_country_metrics

app = Flask(__name__)

service: IntelligenceService | None = None


def _service() -> IntelligenceService:
    global service
    if service is None:
        service = IntelligenceService.from_artifacts()
    return service


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/ready")
def ready():
    status = check_artifacts_ready()
    if status["ready"]:
        return jsonify({"status": "ready", "missing": []}), 200
    return jsonify({"status": "not_ready", "missing": status["missing"]}), 503


@app.post("/predict")
def predict():
    try:
        payload = PredictionRequest.model_validate(request.get_json(force=True))
        result = _service().predict(payload)
        return jsonify(result)
    except FileNotFoundError:
        return jsonify({"error": "Model artifacts unavailable"}), 503
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Invalid payload: {exc}"}), 400


@app.post("/predict/batch")
def predict_batch():
    try:
        payload = BatchPredictionRequest.model_validate(request.get_json(force=True))
        result = _service().predict_batch(payload.items)
        return jsonify(result)
    except FileNotFoundError:
        return jsonify({"error": "Model artifacts unavailable"}), 503
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Invalid payload: {exc}"}), 400


@app.post("/predict/simulate")
def predict_simulate():
    try:
        payload = SimulationRequest.model_validate(request.get_json(force=True))
        result = _service().simulate(payload)
        return jsonify(result)
    except FileNotFoundError:
        return jsonify({"error": "Model artifacts unavailable"}), 503
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Invalid payload: {exc}"}), 400


@app.post("/predict/recommendation")
def predict_recommendation():
    try:
        payload = PredictionRequest.model_validate(request.get_json(force=True))
        result = _service().recommendation(payload)
        return jsonify(result)
    except FileNotFoundError:
        return jsonify({"error": "Model artifacts unavailable"}), 503
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Invalid payload: {exc}"}), 400


@app.get("/predict/feature-importance")
def predict_feature_importance():
    target = request.args.get("target", "subscribers")
    top_n = int(request.args.get("top_n", 15))
    try:
        result = _service().feature_importance(target=target, top_n=top_n)
        return jsonify(result)
    except FileNotFoundError:
        return jsonify({"error": "Model artifacts unavailable"}), 503
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Invalid params: {exc}"}), 400


@app.get("/clusters/summary")
def clusters():
    try:
        return jsonify({"records": _service().clustering.cluster_profiles})
    except FileNotFoundError:
        return jsonify({"error": "Cluster artifacts unavailable"}), 503


@app.get("/maps/country-metrics")
def map_metrics():
    df = load_dataset()
    return jsonify({"records": build_country_metrics(df)})


@app.get("/data/raw-sample")
def raw_sample():
    limit = max(1, min(int(request.args.get("limit", 10)), 200))
    df = load_raw_dataset()
    fields = [
        "youtuber",
        "uploads",
        "category",
        "country",
        "subscribers",
        "highest_yearly_earnings",
        "subscribers_for_last_30_days",
        "created_year",
    ]
    sample_df = df[fields].head(limit)
    sample = sample_df.replace([np.nan, np.inf, -np.inf], None).to_dict(orient="records")
    return jsonify({"records": sample})


@app.get("/data/processed-sample")
def processed_sample():
    limit = max(1, min(int(request.args.get("limit", 10)), 1000))
    df = load_dataset()
    fields = [
        "youtuber",
        "uploads",
        "category",
        "country",
        "age",
        "subscribers",
        "highest_yearly_earnings",
        "growth_target",
    ]
    sample = df[fields].head(limit).to_dict(orient="records")
    return jsonify({"records": sample})


@app.get("/analytics/category-performance")
def category_performance():
    top_n = max(3, min(int(request.args.get("top_n", 12)), 30))
    df = load_dataset()
    agg = (
        df.groupby("category", as_index=False)
        .agg(
            channel_count=("youtuber", "count"),
            avg_subscribers=("subscribers", "mean"),
            avg_earnings=("highest_yearly_earnings", "mean"),
            avg_growth=("growth_target", "mean"),
            total_subscribers=("subscribers", "sum"),
            total_earnings=("highest_yearly_earnings", "sum"),
        )
        .sort_values("total_subscribers", ascending=False)
        .head(top_n)
    )
    return jsonify({"records": agg.to_dict(orient="records")})


@app.get("/analytics/upload-growth-buckets")
def upload_growth_buckets():
    df = load_dataset().copy()
    labels = ["0-100", "101-500", "501-2k", "2k-10k", "10k+"]
    df["upload_bucket"] = np.select(
        [
            (df["uploads"] >= 0) & (df["uploads"] <= 100),
            (df["uploads"] > 100) & (df["uploads"] <= 500),
            (df["uploads"] > 500) & (df["uploads"] <= 2000),
            (df["uploads"] > 2000) & (df["uploads"] <= 10000),
            (df["uploads"] > 10000),
        ],
        labels,
        default="unknown",
    )
    agg = (
        df.groupby("upload_bucket", as_index=False)
        .agg(
            channel_count=("youtuber", "count"),
            avg_growth=("growth_target", "mean"),
            avg_earnings=("highest_yearly_earnings", "mean"),
            avg_subscribers=("subscribers", "mean"),
        )
        .sort_values("upload_bucket")
    )
    return jsonify({"records": agg.to_dict(orient="records")})


@app.get("/mlops/manifest")
def mlops_manifest():
    manifest = load_manifest()
    if manifest is None:
        return jsonify({"error": "Manifest not found"}), 404
    return jsonify(manifest)


@app.get("/mlops/registry")
def mlops_registry():
    registry = load_registry()
    if registry is None:
        return jsonify({"error": "Registry not found"}), 404
    return jsonify(registry)


@app.post("/mlops/drift-check")
def drift_check():
    try:
        payload = DriftCheckRequest.model_validate(request.get_json(force=True))
        result = _service().drift_check(
            requests=payload.items,
            z_threshold=payload.z_threshold,
            min_frequency=payload.min_category_frequency,
        )
        return jsonify(result)
    except FileNotFoundError:
        return jsonify({"error": "Model artifacts unavailable"}), 503
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Invalid payload: {exc}"}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
