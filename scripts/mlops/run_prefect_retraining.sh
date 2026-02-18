#!/usr/bin/env bash
set -euo pipefail

source .venv/bin/activate
export PYTHONPATH=src

python -m pip install --no-build-isolation -e ".[mlops]"
python orchestration/prefect/retraining_flow.py
