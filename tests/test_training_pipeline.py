from pathlib import Path

from youtube_success_ml.config import REPORT_DIR, TrainingConfig
from youtube_success_ml.data.loader import load_dataset
from youtube_success_ml.mlops.registry import MANIFEST_PATH, REGISTRY_PATH
from youtube_success_ml.models.clustering import train_clustering_bundle
from youtube_success_ml.models.supervised import train_supervised_bundle
from youtube_success_ml.train import run_training


def test_train_supervised_bundle(tmp_path: Path):
    df = load_dataset()
    cfg = TrainingConfig(n_estimators=20)
    bundle = train_supervised_bundle(df, config=cfg, model_dir=tmp_path)

    assert (tmp_path / "supervised_bundle.joblib").exists()
    assert set(bundle.metrics.keys()) == {"subscribers", "earnings", "growth"}
    for metric in bundle.metrics.values():
        assert "mae" in metric
        assert "rmse" in metric
        assert "r2" in metric


def test_train_clustering_bundle(tmp_path: Path):
    df = load_dataset()
    cfg = TrainingConfig()
    bundle, enriched = train_clustering_bundle(df, config=cfg, model_dir=tmp_path)

    assert (tmp_path / "clustering_bundle.joblib").exists()
    assert "kmeans_cluster" in enriched.columns
    assert "dbscan_cluster" in enriched.columns
    assert len(bundle.cluster_profiles) >= 1


def test_run_training_produces_mlops_artifacts():
    run_training(run_maps=False)
    assert (REPORT_DIR / "training_metrics.json").exists()
    assert (REPORT_DIR / "data_quality_report.json").exists()
    assert (REPORT_DIR / "training_baseline.json").exists()
    assert (REPORT_DIR / "feature_store_snapshot.csv").exists()
    assert MANIFEST_PATH.exists()
    assert REGISTRY_PATH.exists()
