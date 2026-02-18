PYTHON ?= python3
VENV ?= .venv
PIP := $(VENV)/bin/pip
PY := $(VENV)/bin/python

.PHONY: venv install install-dev train test lint serve-fastapi serve-flask smoke-api frontend-build frontend-dev format-all format-python format-prettier export-processed-data eda k8s-render-rolling k8s-render-canary k8s-render-bluegreen terraform-plan-aws terraform-plan-gcp terraform-plan-azure terraform-plan-oci

venv:
	$(PYTHON) -m venv $(VENV) --system-site-packages

install: venv
	$(PIP) install --no-build-isolation -e .

install-dev: venv
	$(PIP) install --no-build-isolation -e '.[dev]'
	cd frontend && npm install

train:
	PYTHONPATH=src $(PY) -m youtube_success_ml.train --run-all

test:
	PYTHONPATH=src $(PY) -m pytest -q

serve-fastapi:
	PYTHONPATH=src $(VENV)/bin/uvicorn youtube_success_ml.api.fastapi_app:app --host 0.0.0.0 --port 8000

serve-flask:
	PYTHONPATH=src $(PY) -m youtube_success_ml.api.flask_app

smoke-api:
	bash scripts/smoke_api.sh

frontend-build:
	cd frontend && npm run build

frontend-dev:
	cd frontend && npm run dev

format-all:
	bash scripts/format_all.sh

format-python:
	bash scripts/format_python.sh

format-prettier:
	bash scripts/format_prettier.sh

export-processed-data:
	PYTHONPATH=src $(PY) analysis/scripts/export_processed_dataset.py --input "data/Global YouTube Statistics.csv" --output "data/global_youtube_statistics_processed.csv"

eda:
	PYTHONPATH=src $(PY) analysis/scripts/run_eda.py --input "data/Global YouTube Statistics.csv" --output-dir artifacts/reports/eda --top-n-countries 20

k8s-render-rolling:
	kubectl kustomize infra/k8s/overlays/rolling

k8s-render-canary:
	kubectl kustomize infra/k8s/overlays/canary

k8s-render-bluegreen:
	kubectl kustomize infra/k8s/overlays/bluegreen

terraform-plan-aws:
	cd infra/terraform/environments/aws && terraform init && terraform plan

terraform-plan-gcp:
	cd infra/terraform/environments/gcp && terraform init && terraform plan

terraform-plan-azure:
	cd infra/terraform/environments/azure && terraform init && terraform plan

terraform-plan-oci:
	cd infra/terraform/environments/oci && terraform init && terraform plan
