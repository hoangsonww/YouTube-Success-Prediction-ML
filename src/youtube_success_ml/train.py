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


def run_training(run_maps: bool = True) -> dict:
    cfg = TrainingConfig.from_env()
    data_path = resolve_data_path()
    raw_df = load_raw_dataset(path=data_path)
    df = load_dataset(path=data_path)

    supervised = train_supervised_bundle(df, config=cfg, model_dir=MODEL_DIR)
    clustering, _ = train_clustering_bundle(df, config=cfg, model_dir=MODEL_DIR)

    map_paths = export_map_assets(df, output_dir=MAP_DIR) if run_maps else {}

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    data_quality = build_data_quality_report(raw_df=raw_df, processed_df=df)
    save_data_quality_report(data_quality, REPORT_DIR / "data_quality_report.json")
    baseline = build_training_baseline(df)
    save_training_baseline(baseline, REPORT_DIR / "training_baseline.json")

    metrics = {
        "supervised_metrics": supervised.metrics,
        "clusters": clustering.cluster_profiles,
        "maps": {k: str(v) for k, v in map_paths.items()},
    }
    metrics_path = REPORT_DIR / "training_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2))

    run_id = generate_run_id()
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

    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train YouTube success ML models")
    parser.add_argument(
        "--run-all", action="store_true", help="Train all models and export map assets"
    )
    parser.add_argument("--skip-maps", action="store_true", help="Skip map asset generation")
    args = parser.parse_args()

    configure_logging()

    if args.run_all:
        run_training(run_maps=not args.skip_maps)
    else:
        run_training(run_maps=not args.skip_maps)


if __name__ == "__main__":
    main()
