from __future__ import annotations

import re
from collections.abc import Iterable
from datetime import datetime
from pathlib import Path

import pandas as pd

from youtube_success_ml.config import DATASET_FILENAME, DEFAULT_DATA_PATH, PROJECT_ROOT


def _normalize_column_name(col: str) -> str:
    clean = col.strip().replace("%", "pct")
    clean = re.sub(r"[^a-zA-Z0-9]+", "_", clean)
    clean = re.sub(r"_+", "_", clean)
    return clean.strip("_").lower()


def _dedupe_paths(paths: Iterable[Path]) -> list[Path]:
    deduped: list[Path] = []
    seen: set[Path] = set()
    for path in paths:
        candidate = path.expanduser()
        if candidate not in seen:
            seen.add(candidate)
            deduped.append(candidate)
    return deduped


def resolve_data_path(path: Path | str | None = None) -> Path:
    """Resolve dataset path across local/dev/CI package-install contexts."""
    if path is not None:
        explicit = Path(path).expanduser()
        if explicit.exists():
            return explicit
        raise FileNotFoundError(f"Dataset not found at explicit path: {explicit}")

    cwd = Path.cwd().resolve()
    candidates = [
        cwd / "data" / DATASET_FILENAME,
        cwd / DATASET_FILENAME,
        DEFAULT_DATA_PATH,
        PROJECT_ROOT / "data" / DATASET_FILENAME,
    ]
    candidates.extend(parent / "data" / DATASET_FILENAME for parent in cwd.parents)
    module_root = Path(__file__).resolve().parents[1]
    candidates.append(module_root / "data" / DATASET_FILENAME)

    deduped = _dedupe_paths(candidates)
    for candidate in deduped:
        if candidate.exists():
            return candidate

    searched = "\n".join(f"- {candidate}" for candidate in deduped[:8])
    raise FileNotFoundError(
        "Could not locate dataset. Set YTS_DATA_PATH or place the CSV in one of these paths:\n"
        f"{searched}"
    )


def load_raw_dataset(path: Path | str | None = None) -> pd.DataFrame:
    """Load source dataset and normalize schema without feature engineering."""
    file_path = resolve_data_path(path)
    df = pd.read_csv(file_path, encoding="latin-1")
    df.columns = [_normalize_column_name(c) for c in df.columns]

    numeric_columns = [
        "subscribers",
        "uploads",
        "video_views",
        "video_views_for_the_last_30_days",
        "lowest_monthly_earnings",
        "highest_monthly_earnings",
        "lowest_yearly_earnings",
        "highest_yearly_earnings",
        "subscribers_for_last_30_days",
        "created_year",
        "latitude",
        "longitude",
        "population",
        "urban_population",
        "unemployment_rate",
        "gross_tertiary_education_enrollment_pct",
    ]
    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def load_dataset(path: Path | str | None = None) -> pd.DataFrame:
    """Load cleaned dataset with feature engineering for modeling."""
    df = load_raw_dataset(path=path)

    df["country"] = df["country"].fillna("Unknown").astype(str)
    df["category"] = df["category"].fillna("Unknown").astype(str)
    df["abbreviation"] = df["abbreviation"].fillna("UN").astype(str)

    current_year = datetime.utcnow().year
    if "created_year" in df.columns:
        df["age"] = (current_year - df["created_year"]).clip(lower=0)
    else:
        df["age"] = 0

    df["age"] = df["age"].fillna(df["age"].median()).round().astype(int)
    df["uploads"] = df["uploads"].fillna(0).clip(lower=0)
    df["subscribers"] = df["subscribers"].fillna(0).clip(lower=0)
    df["highest_yearly_earnings"] = df["highest_yearly_earnings"].fillna(0).clip(lower=0)
    df["subscribers_for_last_30_days"] = df["subscribers_for_last_30_days"].fillna(0).clip(lower=0)

    # Supervised learning target for growth.
    df["growth_target"] = df["subscribers_for_last_30_days"]

    return df
