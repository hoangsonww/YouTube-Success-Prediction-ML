from __future__ import annotations

import argparse
import json

from youtube_success_ml.config import (
    MAP_DIR,
    MODEL_DIR,
    REPORT_DIR,
    TrainingConfig,
)
from youtube_success_ml.data.loader import load_dataset, load_raw_dataset, resolve_data_path
from youtube_success_ml.logging_utils import configure_logging
from youtube_success_ml.mlops.drift import build_training_baseline, save_training_baseline
from youtube_success_ml.mlops.experiments import ExperimentTracker
from youtube_success_ml.mlops.feature_store import save_feature_snapshot
from youtube_success_ml.mlops.hpo import OptunaConfig, run_supervised_hpo
from youtube_success_ml.mlops.quality import build_data_quality_report, save_data_quality_report
from youtube_success_ml.mlops.registry import (
    build_training_manifest,
    generate_run_id,
    update_registry,
    write_manifest,
)
from youtube_success_ml.models.clustering import train_clustering_bundle
from youtube_success_ml.models.supervised import train_supervised_bundle
from youtube_success_ml.visualization.maps import export_map_assets


def _flatten_metrics(metrics: dict) -> dict[str, float]:
    flat: dict[str, float] = {}
    supervised = metrics.get("supervised_metrics", {})
    for target, target_metrics in supervised.items():
        if not isinstance(target_metrics, dict):
            continue
        for key, value in target_metrics.items():
            try:
                flat[f"{target}_{key}"] = float(value)
            except (TypeError, ValueError):
                continue
    if "hpo_best_rmse" in metrics:
        flat["hpo_best_rmse"] = float(metrics["hpo_best_rmse"])
    return flat


def run_training(
    run_maps: bool = True,
    optuna_trials: int = 0,
    optuna_timeout_seconds: int | None = None,
    optuna_storage: str | None = None,
    optuna_study_name: str = "yts-supervised-hpo",
) -> dict:
    cfg = TrainingConfig.from_env()
    run_id = generate_run_id()
    tracker = ExperimentTracker.start(run_name="yts-training", run_id=run_id)
    try:
        data_path = resolve_data_path()
        raw_df = load_raw_dataset(path=data_path)
        df = load_dataset(path=data_path)

        if optuna_trials > 0:
            hpo_result = run_supervised_hpo(
                df=df,
                base_config=cfg,
                report_dir=REPORT_DIR,
                optuna_cfg=OptunaConfig(
                    n_trials=optuna_trials,
                    timeout_seconds=optuna_timeout_seconds,
                    study_name=optuna_study_name,
                    storage=optuna_storage,
                ),
            )
            cfg = TrainingConfig(
                random_state=cfg.random_state,
                test_size=cfg.test_size,
                n_estimators=int(hpo_result.best_params.get("n_estimators", cfg.n_estimators)),
                min_samples_leaf=int(
                    hpo_result.best_params.get("min_samples_leaf", cfg.min_samples_leaf)
                ),
                n_clusters=cfg.n_clusters,
                dbscan_eps=cfg.dbscan_eps,
                dbscan_min_samples=cfg.dbscan_min_samples,
            )
        else:
            hpo_result = None

        tracker.log_params(
            {
                "random_state": cfg.random_state,
                "test_size": cfg.test_size,
                "n_estimators": cfg.n_estimators,
                "min_samples_leaf": cfg.min_samples_leaf,
                "n_clusters": cfg.n_clusters,
                "dbscan_eps": cfg.dbscan_eps,
                "dbscan_min_samples": cfg.dbscan_min_samples,
                "run_maps": run_maps,
                "optuna_trials": optuna_trials,
            }
        )

        supervised = train_supervised_bundle(df, config=cfg, model_dir=MODEL_DIR)
        clustering, _ = train_clustering_bundle(df, config=cfg, model_dir=MODEL_DIR)

        map_paths = export_map_assets(df, output_dir=MAP_DIR) if run_maps else {}

        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        data_quality = build_data_quality_report(raw_df=raw_df, processed_df=df)
        save_data_quality_report(data_quality, REPORT_DIR / "data_quality_report.json")
        baseline = build_training_baseline(df)
        save_training_baseline(baseline, REPORT_DIR / "training_baseline.json")
        feature_snapshot_path = save_feature_snapshot(df, REPORT_DIR / "feature_store_snapshot.csv")

        metrics = {
            "supervised_metrics": supervised.metrics,
            "clusters": clustering.cluster_profiles,
            "maps": {k: str(v) for k, v in map_paths.items()},
        }
        if hpo_result is not None:
            metrics["hpo_best_params"] = hpo_result.best_params
            metrics["hpo_best_rmse"] = hpo_result.best_value

        metrics_path = REPORT_DIR / "training_metrics.json"
        metrics_path.write_text(json.dumps(metrics, indent=2))

        manifest = build_training_manifest(
            run_id=run_id,
            config=cfg,
            metrics=metrics,
            data_path=data_path,
            model_dir=MODEL_DIR,
            report_dir=REPORT_DIR,
        )
        write_manifest(manifest)
        update_registry(manifest)

        tracker.log_metrics(_flatten_metrics(metrics))
        tracker.log_artifacts(
            [
                metrics_path,
                REPORT_DIR / "data_quality_report.json",
                REPORT_DIR / "training_baseline.json",
                feature_snapshot_path,
            ]
        )
        if hpo_result is not None:
            tracker.log_artifact(hpo_result.artifact_path)

        return metrics
    finally:
        tracker.end()


def main() -> None:
    parser = argparse.ArgumentParser(description="Train YouTube Success Prediction ML models")
    parser.add_argument(
        "--run-all", action="store_true", help="Train all models and export map assets"
    )
    parser.add_argument("--skip-maps", action="store_true", help="Skip map asset generation")
    parser.add_argument("--optuna-trials", type=int, default=0, help="Run Optuna trials (>0)")
    parser.add_argument(
        "--optuna-timeout-seconds",
        type=int,
        default=None,
        help="Optional max duration for Optuna in seconds",
    )
    parser.add_argument(
        "--optuna-storage",
        type=str,
        default=None,
        help="Optuna storage URI (for persistent studies)",
    )
    parser.add_argument(
        "--optuna-study-name",
        type=str,
        default="yts-supervised-hpo",
        help="Optuna study name",
    )
    args = parser.parse_args()

    configure_logging()

    if args.run_all:
        run_training(
            run_maps=not args.skip_maps,
            optuna_trials=max(args.optuna_trials, 0),
            optuna_timeout_seconds=args.optuna_timeout_seconds,
            optuna_storage=args.optuna_storage,
            optuna_study_name=args.optuna_study_name,
        )
    else:
        run_training(
            run_maps=not args.skip_maps,
            optuna_trials=max(args.optuna_trials, 0),
            optuna_timeout_seconds=args.optuna_timeout_seconds,
            optuna_storage=args.optuna_storage,
            optuna_study_name=args.optuna_study_name,
        )


if __name__ == "__main__":
    main()
