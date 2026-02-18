from __future__ import annotations

from datetime import timedelta
from pathlib import Path

from feast import Entity, FeatureView, Field, FileSource, ValueType
from feast.types import Float32, Int64, String

REPO_ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT_PATH = REPO_ROOT / "artifacts" / "reports" / "feature_store_snapshot.csv"

channel_entity = Entity(
    name="channel_id",
    value_type=ValueType.STRING,
    description="Synthetic channel key",
)

channel_features_source = FileSource(
    path=str(SNAPSHOT_PATH),
    timestamp_field="event_timestamp",
)

channel_growth_features = FeatureView(
    name="channel_growth_features",
    entities=[channel_entity],
    ttl=timedelta(days=30),
    schema=[
        Field(name="uploads", dtype=Int64),
        Field(name="age", dtype=Int64),
        Field(name="category", dtype=String),
        Field(name="country", dtype=String),
        Field(name="subscribers", dtype=Float32),
        Field(name="highest_yearly_earnings", dtype=Float32),
        Field(name="growth_target", dtype=Float32),
    ],
    source=channel_features_source,
    online=True,
)
