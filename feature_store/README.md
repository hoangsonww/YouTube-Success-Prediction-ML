# Feature Store and Data Versioning

This directory contains production-oriented scaffolding for:

- Feast-based feature definitions (`feature_store/feast`)
- DVC pipeline metadata (`dvc.yaml`, `params.yaml`) at repository root

## Local Setup

```bash
source .venv/bin/activate
pip install --no-build-isolation -e ".[mlops]"
```

## Export Feature Snapshot

```bash
PYTHONPATH=src python scripts/mlops/export_feature_store_snapshot.py
```

This writes:

- `artifacts/reports/feature_store_snapshot.csv`

## Feast Quickstart

```bash
cd feature_store/feast
feast apply
```

## DVC Quickstart

```bash
dvc init
dvc repro
```
