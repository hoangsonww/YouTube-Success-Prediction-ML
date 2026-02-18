from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


def _column_missing_percent(df: pd.DataFrame) -> dict[str, float]:
    return {k: float(v) for k, v in ((df.isna().mean() * 100).round(3)).to_dict().items()}


def build_data_quality_report(raw_df: pd.DataFrame, processed_df: pd.DataFrame) -> dict[str, Any]:
    numeric_cols = processed_df.select_dtypes(include="number").columns.tolist()
    numeric_summary = (
        processed_df[numeric_cols]
        .describe()
        .T[["mean", "std", "min", "max"]]
        .fillna(0)
        .round(3)
        .to_dict("index")
        if numeric_cols
        else {}
    )

    report = {
        "raw": {
            "rows": int(len(raw_df)),
            "columns": int(raw_df.shape[1]),
            "duplicates": int(raw_df.duplicated().sum()),
            "missing_percent": _column_missing_percent(raw_df),
        },
        "processed": {
            "rows": int(len(processed_df)),
            "columns": int(processed_df.shape[1]),
            "duplicates": int(processed_df.duplicated().sum()),
            "missing_percent": _column_missing_percent(processed_df),
            "numeric_summary": numeric_summary,
            "feature_cardinality": {
                "category": int(processed_df["category"].nunique()),
                "country": int(processed_df["country"].nunique()),
            },
        },
        "transformations": {
            "age_engineered": "age = current_year - created_year (clipped >= 0, median-imputed, integer)",
            "growth_target": "growth_target = subscribers_for_last_30_days (null->0)",
            "categorical_fill": "country/category filled with 'Unknown'",
        },
    }
    return report


def save_data_quality_report(report: dict[str, Any], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return path
