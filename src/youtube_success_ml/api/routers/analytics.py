from __future__ import annotations

import numpy as np
from fastapi import APIRouter, Query

from youtube_success_ml.api.dependencies import get_service
from youtube_success_ml.data.loader import load_dataset, load_raw_dataset
from youtube_success_ml.visualization.maps import build_country_metrics

router = APIRouter(tags=["analytics"])


@router.get("/clusters/summary")
def cluster_summary():
    service = get_service()
    return {"records": service.clustering.cluster_profiles}


@router.get("/maps/country-metrics")
def country_metrics():
    df = load_dataset()
    return {"records": build_country_metrics(df)}


@router.get("/data/raw-sample")
def raw_sample(limit: int = Query(default=10, ge=1, le=200)):
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
    return {"records": sample}


@router.get("/data/processed-sample")
def processed_sample(limit: int = Query(default=10, ge=1, le=1000)):
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
    return {"records": sample}


@router.get("/analytics/category-performance")
def category_performance(top_n: int = Query(default=12, ge=3, le=30)):
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
    return {"records": agg.to_dict(orient="records")}


@router.get("/analytics/upload-growth-buckets")
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
    return {"records": agg.to_dict(orient="records")}
