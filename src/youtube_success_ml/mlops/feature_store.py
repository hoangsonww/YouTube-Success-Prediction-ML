from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from youtube_success_ml.models.supervised import FEATURE_COLUMNS, TARGET_COLUMNS


def build_feature_snapshot(df: pd.DataFrame) -> pd.DataFrame:
    snapshot = df[FEATURE_COLUMNS + list(TARGET_COLUMNS.values())].copy()
    snapshot["channel_id"] = [f"channel-{i}" for i in range(len(snapshot))]
    snapshot["event_timestamp"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    ordered = [
        "channel_id",
        *FEATURE_COLUMNS,
        *list(TARGET_COLUMNS.values()),
        "event_timestamp",
    ]
    return snapshot[ordered]


def save_feature_snapshot(df: pd.DataFrame, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot = build_feature_snapshot(df)
    snapshot.to_csv(output_path, index=False)
    return output_path
