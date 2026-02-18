#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRETTIER_LOCAL="${ROOT_DIR}/frontend/node_modules/.bin/prettier"
PRETTIER_BIN=""

if [[ -x "${PRETTIER_LOCAL}" ]]; then
  PRETTIER_BIN="${PRETTIER_LOCAL}"
elif command -v prettier >/dev/null 2>&1; then
  PRETTIER_BIN="$(command -v prettier)"
fi

if [[ -z "${PRETTIER_BIN}" ]]; then
  echo "prettier not found." >&2
  echo "Install one of:" >&2
  echo "  1) cd frontend && npm install --save-dev prettier" >&2
  echo "  2) npm install -g prettier" >&2
  exit 1
fi

"${PRETTIER_BIN}" --write "${ROOT_DIR}" --ignore-path "${ROOT_DIR}/.prettierignore" --config "${ROOT_DIR}/.prettierrc.json"
