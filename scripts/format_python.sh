#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUFF_BIN="${ROOT_DIR}/.venv/bin/ruff"

if [[ ! -x "${RUFF_BIN}" ]]; then
  RUFF_BIN="$(command -v ruff || true)"
fi

if [[ -n "${RUFF_BIN}" && -x "${RUFF_BIN}" ]]; then
  "${RUFF_BIN}" format "${ROOT_DIR}"
  "${RUFF_BIN}" check "${ROOT_DIR}" --select I --fix
  exit 0
fi

BLACK_BIN="$(command -v black || true)"
ISORT_BIN="$(command -v isort || true)"

if [[ -n "${BLACK_BIN}" && -x "${BLACK_BIN}" && -n "${ISORT_BIN}" && -x "${ISORT_BIN}" ]]; then
  echo "ruff not found; using black + isort fallback" >&2
  "${BLACK_BIN}" "${ROOT_DIR}" --line-length 100 --target-version py310
  "${ISORT_BIN}" "${ROOT_DIR}" --profile black --line-length 100
  exit 0
fi

echo "No Python formatter found (ruff or black+isort). Skipping Python formatting." >&2
echo "recommended: source .venv/bin/activate && pip install --no-build-isolation -e '.[dev]'" >&2
exit 0
