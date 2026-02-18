from __future__ import annotations

import os
from pathlib import Path

from prefect import flow, get_run_logger, task

from youtube_success_ml.train import run_training


@task(retries=2, retry_delay_seconds=20)
def retrain_task(run_maps: bool, optuna_trials: int) -> dict:
    return run_training(run_maps=run_maps, optuna_trials=optuna_trials)


@task
def validate_artifacts() -> list[str]:
    paths = [
        Path("artifacts/models/supervised_bundle.joblib"),
        Path("artifacts/models/clustering_bundle.joblib"),
        Path("artifacts/reports/training_metrics.json"),
        Path("artifacts/mlops/training_manifest.json"),
        Path("artifacts/mlops/model_registry.json"),
    ]
    missing = [str(p) for p in paths if not p.exists()]
    if missing:
        raise RuntimeError(f"Missing artifacts after retraining: {missing}")
    return [str(p) for p in paths]


@flow(name="youtube-success-ml-retraining")
def scheduled_retraining_flow(run_maps: bool = True, optuna_trials: int = 0) -> dict:
    logger = get_run_logger()
    logger.info(
        "Starting scheduled retraining. run_maps=%s optuna_trials=%s", run_maps, optuna_trials
    )
    metrics = retrain_task(run_maps=run_maps, optuna_trials=optuna_trials)
    artifacts = validate_artifacts()
    logger.info("Retraining completed. Validated artifacts: %s", artifacts)
    return {"metrics": metrics, "artifacts": artifacts}


if __name__ == "__main__":
    run_maps = os.getenv("YTS_FLOW_RUN_MAPS", "true").lower() in {"1", "true", "yes", "on"}
    optuna_trials = int(os.getenv("YTS_FLOW_OPTUNA_TRIALS", "0"))
    scheduled_retraining_flow(run_maps=run_maps, optuna_trials=optuna_trials)
