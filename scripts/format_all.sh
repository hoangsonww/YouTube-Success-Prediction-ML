#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[format] Prettier (excluding Markdown)"
bash "${ROOT_DIR}/scripts/format_prettier.sh"

echo "[format] Ruff format"
bash "${ROOT_DIR}/scripts/format_python.sh"

echo "Formatting complete."
