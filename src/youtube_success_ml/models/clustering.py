from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN, KMeans
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from youtube_success_ml.config import MODEL_DIR, TrainingConfig

CLUSTER_FEATURES = ["uploads", "subscribers", "highest_yearly_earnings", "growth_target"]


@dataclass
class ClusteringBundle:
    kmeans_pipeline: Pipeline
    dbscan_pipeline: Pipeline
    cluster_profiles: list[dict[str, Any]]
    cluster_name_map: dict[int, str]


def _build_cluster_profiles(
    df: pd.DataFrame, cluster_col: str, name_map: dict[int, str]
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    grouped = df.groupby(cluster_col, dropna=False)
    for cluster_id, chunk in grouped:
        dominant_category = (
            chunk["category"].mode().iloc[0] if not chunk["category"].mode().empty else "Unknown"
        )
        rows.append(
            {
                "cluster_id": int(cluster_id),
                "archetype": name_map.get(int(cluster_id), f"Cluster {cluster_id}"),
                "size": int(len(chunk)),
                "avg_uploads": float(chunk["uploads"].mean()),
                "avg_subscribers": float(chunk["subscribers"].mean()),
                "avg_earnings": float(chunk["highest_yearly_earnings"].mean()),
                "avg_growth": float(chunk["growth_target"].mean()),
                "dominant_category": str(dominant_category),
            }
        )
    rows.sort(key=lambda row: row["cluster_id"])
    return rows


def _assign_kmeans_names(df: pd.DataFrame) -> dict[int, str]:
    summary = (
        df.groupby("kmeans_cluster")[CLUSTER_FEATURES]
        .mean()
        .assign(earnings_per_upload=lambda s: s["highest_yearly_earnings"] / (s["uploads"] + 1))
    )

    available = set(int(i) for i in summary.index.tolist())
    result: dict[int, str] = {}

    if not available:
        return result

    c_viral = int(summary["growth_target"].idxmax())
    result[c_viral] = "Viral entertainers"
    available.discard(c_viral)

    if available:
        c_earning = int(summary.loc[list(available)]["earnings_per_upload"].idxmax())
        result[c_earning] = "High earning low upload"
        available.discard(c_earning)

    if available:
        scored = summary.loc[list(available)].assign(
            score=lambda s: s["uploads"].rank(pct=True) - s["growth_target"].rank(pct=True)
        )
        c_upload = int(scored["score"].idxmax())
        result[c_upload] = "High upload low growth"
        available.discard(c_upload)

    for c in sorted(available):
        result[c] = "Consistent educators"

    return result


def train_clustering_bundle(
    df: pd.DataFrame,
    config: TrainingConfig,
    model_dir: Path | None = None,
) -> tuple[ClusteringBundle, pd.DataFrame]:
    model_dir = model_dir or MODEL_DIR
    model_dir.mkdir(parents=True, exist_ok=True)

    X = df[CLUSTER_FEATURES].fillna(0)

    kmeans_pipeline = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "cluster",
                KMeans(
                    n_clusters=config.n_clusters, random_state=config.random_state, n_init="auto"
                ),
            ),
        ]
    )
    dbscan_pipeline = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "cluster",
                DBSCAN(eps=config.dbscan_eps, min_samples=config.dbscan_min_samples),
            ),
        ]
    )

    kmeans_labels = kmeans_pipeline.fit_predict(X)
    dbscan_labels = dbscan_pipeline.fit_predict(X)

    enriched = df.copy()
    enriched["kmeans_cluster"] = kmeans_labels.astype(int)
    enriched["dbscan_cluster"] = dbscan_labels.astype(int)

    cluster_name_map = _assign_kmeans_names(enriched)
    profiles = _build_cluster_profiles(enriched, "kmeans_cluster", cluster_name_map)

    bundle = ClusteringBundle(
        kmeans_pipeline=kmeans_pipeline,
        dbscan_pipeline=dbscan_pipeline,
        cluster_profiles=profiles,
        cluster_name_map=cluster_name_map,
    )
    joblib.dump(bundle, model_dir / "clustering_bundle.joblib")
    enriched.to_csv(model_dir / "clustered_channels.csv", index=False)
    return bundle, enriched


def load_clustering_bundle(model_dir: Path | None = None) -> ClusteringBundle:
    model_dir = model_dir or MODEL_DIR
    return joblib.load(model_dir / "clustering_bundle.joblib")


def predict_kmeans_cluster(
    bundle: ClusteringBundle,
    uploads: float,
    subscribers: float,
    earnings: float,
    growth: float,
) -> tuple[int, str]:
    X = pd.DataFrame(
        [
            {
                "uploads": uploads,
                "subscribers": subscribers,
                "highest_yearly_earnings": earnings,
                "growth_target": growth,
            }
        ]
    )
    cluster = int(bundle.kmeans_pipeline.predict(X)[0])
    archetype = bundle.cluster_name_map.get(cluster, f"Cluster {cluster}")
    return cluster, archetype
