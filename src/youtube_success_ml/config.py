from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_PATH = PROJECT_ROOT / "data" / "Global YouTube Statistics.csv"
ARTIFACT_DIR = PROJECT_ROOT / "artifacts"
MODEL_DIR = Path(os.getenv("YTS_MODEL_DIR", ARTIFACT_DIR / "models"))
REPORT_DIR = ARTIFACT_DIR / "reports"
MAP_DIR = ARTIFACT_DIR / "maps"


@dataclass(frozen=True)
class TrainingConfig:
    random_state: int = 42
    test_size: float = 0.2
    n_estimators: int = 120
    min_samples_leaf: int = 2
    n_clusters: int = 4
    dbscan_eps: float = 0.95
    dbscan_min_samples: int = 12

    @classmethod
    def from_env(cls) -> "TrainingConfig":
        return cls(
            random_state=int(os.getenv("YTS_RANDOM_STATE", "42")),
            test_size=float(os.getenv("YTS_TEST_SIZE", "0.2")),
            n_estimators=int(os.getenv("YTS_N_ESTIMATORS", "120")),
            min_samples_leaf=int(os.getenv("YTS_MIN_SAMPLES_LEAF", "2")),
            n_clusters=int(os.getenv("YTS_N_CLUSTERS", "4")),
            dbscan_eps=float(os.getenv("YTS_DBSCAN_EPS", "0.95")),
            dbscan_min_samples=int(os.getenv("YTS_DBSCAN_MIN_SAMPLES", "12")),
        )
