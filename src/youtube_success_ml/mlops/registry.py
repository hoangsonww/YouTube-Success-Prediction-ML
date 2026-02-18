from __future__ import annotations

import hashlib
import json
import platform
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from youtube_success_ml.config import ARTIFACT_DIR, MODEL_DIR, REPORT_DIR, TrainingConfig

MLOPS_DIR = ARTIFACT_DIR / "mlops"
MANIFEST_PATH = MLOPS_DIR / "training_manifest.json"
REGISTRY_PATH = MLOPS_DIR / "model_registry.json"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def generate_run_id() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    return f"{ts}Z-{uuid4().hex[:8]}"


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def expected_artifacts(
    model_dir: Path | None = None, report_dir: Path | None = None
) -> dict[str, Path]:
    model_dir = model_dir or MODEL_DIR
    report_dir = report_dir or REPORT_DIR
    return {
        "supervised_bundle": model_dir / "supervised_bundle.joblib",
        "clustering_bundle": model_dir / "clustering_bundle.joblib",
        "clustered_channels": model_dir / "clustered_channels.csv",
        "training_metrics": report_dir / "training_metrics.json",
        "data_quality_report": report_dir / "data_quality_report.json",
        "training_baseline": report_dir / "training_baseline.json",
        "training_manifest": MANIFEST_PATH,
    }


def check_artifacts_ready(
    model_dir: Path | None = None, report_dir: Path | None = None
) -> dict[str, Any]:
    artifacts = expected_artifacts(model_dir=model_dir, report_dir=report_dir)
    exists = {name: path.exists() for name, path in artifacts.items()}
    missing = [name for name, ok in exists.items() if not ok]
    return {
        "ready": len(missing) == 0,
        "missing": missing,
        "artifacts": {name: str(path) for name, path in artifacts.items()},
    }


def build_training_manifest(
    run_id: str,
    config: TrainingConfig,
    metrics: dict[str, Any],
    data_path: Path,
    model_dir: Path | None = None,
    report_dir: Path | None = None,
) -> dict[str, Any]:
    model_dir = model_dir or MODEL_DIR
    report_dir = report_dir or REPORT_DIR

    artifact_paths = expected_artifacts(model_dir=model_dir, report_dir=report_dir)
    existing_paths = {k: v for k, v in artifact_paths.items() if v.exists()}

    return {
        "run_id": run_id,
        "timestamp_utc": utc_now_iso(),
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "data_path": str(data_path),
        "data_sha256": file_sha256(data_path),
        "training_config": {
            "random_state": config.random_state,
            "test_size": config.test_size,
            "n_estimators": config.n_estimators,
            "min_samples_leaf": config.min_samples_leaf,
            "n_clusters": config.n_clusters,
            "dbscan_eps": config.dbscan_eps,
            "dbscan_min_samples": config.dbscan_min_samples,
        },
        "metrics": metrics,
        "artifact_hashes": {k: file_sha256(v) for k, v in existing_paths.items()},
        "artifact_paths": {k: str(v) for k, v in existing_paths.items()},
    }


def write_manifest(manifest: dict[str, Any], manifest_path: Path = MANIFEST_PATH) -> Path:
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest_path


def update_registry(manifest: dict[str, Any], registry_path: Path = REGISTRY_PATH) -> Path:
    registry_path.parent.mkdir(parents=True, exist_ok=True)
    if registry_path.exists():
        payload = json.loads(registry_path.read_text(encoding="utf-8"))
    else:
        payload = {"active_run_id": None, "runs": []}

    payload["runs"] = [r for r in payload.get("runs", []) if r.get("run_id") != manifest["run_id"]]
    payload["runs"].append(
        {
            "run_id": manifest["run_id"],
            "timestamp_utc": manifest["timestamp_utc"],
            "artifact_paths": manifest["artifact_paths"],
            "training_config": manifest["training_config"],
        }
    )
    payload["runs"] = sorted(payload["runs"], key=lambda r: r["timestamp_utc"])
    payload["active_run_id"] = manifest["run_id"]

    registry_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return registry_path


def load_manifest(manifest_path: Path = MANIFEST_PATH) -> dict[str, Any] | None:
    if not manifest_path.exists():
        return None
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def load_registry(registry_path: Path = REGISTRY_PATH) -> dict[str, Any] | None:
    if not registry_path.exists():
        return None
    return json.loads(registry_path.read_text(encoding="utf-8"))
