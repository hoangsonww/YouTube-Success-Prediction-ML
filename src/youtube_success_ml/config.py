from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

DATASET_FILENAME = "Global YouTube Statistics.csv"


def _candidate_roots() -> list[Path]:
    cwd = Path.cwd().resolve()
    module_root = Path(__file__).resolve().parents[2]
    candidates = [cwd, *cwd.parents, module_root, *module_root.parents]

    # Preserve order while deduplicating.
    deduped: list[Path] = []
    seen: set[Path] = set()
    for candidate in candidates:
        if candidate not in seen:
            seen.add(candidate)
            deduped.append(candidate)
    return deduped


def _resolve_project_root() -> Path:
    env_root = os.getenv("YTS_PROJECT_ROOT")
    if env_root:
        return Path(env_root).expanduser().resolve()

    candidates = _candidate_roots()

    for root in candidates:
        if (root / "pyproject.toml").exists() and (root / "data").exists():
            return root

    for root in candidates:
        if (root / "data" / DATASET_FILENAME).exists():
            return root

    return Path.cwd().resolve()


PROJECT_ROOT = _resolve_project_root()
DEFAULT_DATA_PATH = Path(
    os.getenv("YTS_DATA_PATH", str(PROJECT_ROOT / "data" / DATASET_FILENAME))
).expanduser()
ARTIFACT_DIR = Path(os.getenv("YTS_ARTIFACT_DIR", str(PROJECT_ROOT / "artifacts"))).expanduser()
MODEL_DIR = Path(os.getenv("YTS_MODEL_DIR", str(ARTIFACT_DIR / "models"))).expanduser()
REPORT_DIR = Path(os.getenv("YTS_REPORT_DIR", str(ARTIFACT_DIR / "reports"))).expanduser()
MAP_DIR = Path(os.getenv("YTS_MAP_DIR", str(ARTIFACT_DIR / "maps"))).expanduser()


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
