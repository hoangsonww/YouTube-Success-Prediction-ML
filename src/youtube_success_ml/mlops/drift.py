from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from youtube_success_ml.models.supervised import FEATURE_COLUMNS

NUMERIC_FEATURES = ["uploads", "age"]
CATEGORICAL_FEATURES = ["category", "country"]


def build_training_baseline(df: pd.DataFrame) -> dict[str, Any]:
    """Build drift baseline from model feature columns."""
    feature_df = df[FEATURE_COLUMNS].copy()

    numeric_stats: dict[str, dict[str, float]] = {}
    for col in NUMERIC_FEATURES:
        series = pd.to_numeric(feature_df[col], errors="coerce").fillna(0)
        std = float(series.std())
        numeric_stats[col] = {
            "mean": float(series.mean()),
            "std": std if std > 1e-9 else 1.0,
            "p95": float(series.quantile(0.95)),
        }

    categorical_stats: dict[str, dict[str, float]] = {}
    for col in CATEGORICAL_FEATURES:
        freqs = (
            feature_df[col]
            .fillna("Unknown")
            .astype(str)
            .value_counts(normalize=True)
            .round(6)
            .to_dict()
        )
        categorical_stats[col] = {str(k): float(v) for k, v in freqs.items()}

    return {
        "features": FEATURE_COLUMNS,
        "numeric": numeric_stats,
        "categorical": categorical_stats,
    }


def save_training_baseline(baseline: dict[str, Any], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(baseline, indent=2), encoding="utf-8")
    return path


def load_training_baseline(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def check_feature_drift(
    items: list[dict[str, Any]],
    baseline: dict[str, Any],
    z_threshold: float = 3.0,
    min_category_frequency: float = 0.01,
) -> dict[str, Any]:
    """Score input payloads against training baseline distributions."""
    records: list[dict[str, Any]] = []
    severe_count = 0

    numeric_baseline = baseline.get("numeric", {})
    categorical_baseline = baseline.get("categorical", {})

    for idx, item in enumerate(items):
        warnings: list[str] = []

        for col in NUMERIC_FEATURES:
            stats = numeric_baseline.get(col, {"mean": 0.0, "std": 1.0})
            value = float(item[col])
            z = abs((value - float(stats["mean"])) / max(float(stats["std"]), 1e-9))
            if z > z_threshold:
                warnings.append(f"{col}: high z-score {z:.2f}")

        for col in CATEGORICAL_FEATURES:
            value = str(item[col])
            frequency = float(categorical_baseline.get(col, {}).get(value, 0.0))
            if frequency < min_category_frequency:
                warnings.append(f"{col}: low-frequency category '{value}' ({frequency:.4f})")

        severity = "high" if len(warnings) >= 2 else "medium" if len(warnings) == 1 else "low"
        if severity == "high":
            severe_count += 1

        records.append(
            {
                "index": idx,
                "warnings": warnings,
                "severity": severity,
            }
        )

    summary = {
        "total_records": len(records),
        "high_severity_records": severe_count,
        "is_drift_risk": severe_count > 0,
    }
    return {"summary": summary, "records": records}
