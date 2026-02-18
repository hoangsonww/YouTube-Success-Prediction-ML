# Analysis Workspace

This directory contains production-style data exploration and EDA assets.

## Layout

- `analysis/scripts/run_eda.py`: runs dataset exploration and exports EDA artifacts.
- `analysis/scripts/export_processed_dataset.py`: exports cleaned/model-ready CSV to `data/`.
- `analysis/notebooks/01_data_exploration.ipynb`: interactive raw vs processed exploration.
- `analysis/notebooks/02_modeling_readiness.ipynb`: model contract and readiness checks.
- `analysis/notebooks/03_data_quality_and_cleaning_audit.ipynb`: raw-to-processed quality audit.
- `analysis/notebooks/04_feature_engineering_audit.ipynb`: feature coverage and engineering diagnostics.
- `analysis/notebooks/05_supervised_model_baseline.ipynb`: supervised baseline training and importance analysis.
- `analysis/notebooks/06_clustering_insights.ipynb`: KMeans/DBSCAN profile and segment exploration.
- `analysis/notebooks/07_global_intelligence_maps.ipynb`: country intelligence and map asset generation.

## Notebook Flow (Recommended)

1. `01_data_exploration.ipynb` - establish raw/processed understanding.
2. `03_data_quality_and_cleaning_audit.ipynb` - validate transformation quality.
3. `04_feature_engineering_audit.ipynb` - verify model input assumptions.
4. `02_modeling_readiness.ipynb` - confirm contract/readiness before training.
5. `05_supervised_model_baseline.ipynb` - baseline metrics + explainability.
6. `06_clustering_insights.ipynb` - unsupervised segmentation review.
7. `07_global_intelligence_maps.ipynb` - map/export analytics outputs.

## Production Notes

- Notebooks are intentionally modular: each notebook has a single primary objective.
- CLI scripts remain the source of truth for repeatable CI-safe EDA/export tasks.
- Use notebooks for investigation and interpretation; use scripts for deterministic artifact generation.

## Run EDA

```bash
source .venv/bin/activate
PYTHONPATH=src python analysis/scripts/run_eda.py \
  --input "data/Global YouTube Statistics.csv" \
  --output-dir artifacts/reports/eda \
  --top-n-countries 20
```

## Export Processed CSV

```bash
source .venv/bin/activate
PYTHONPATH=src python analysis/scripts/export_processed_dataset.py \
  --input "data/Global YouTube Statistics.csv" \
  --output "data/global_youtube_statistics_processed.csv"
```

Outputs:

- `data/global_youtube_statistics_processed.csv`
- `artifacts/reports/processed_dataset_metadata.json`
