#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[devcontainer] Bootstrapping Python virtual environment"
if [[ ! -d "${ROOT_DIR}/.venv" ]]; then
  python -m venv "${ROOT_DIR}/.venv" --system-site-packages
fi

source "${ROOT_DIR}/.venv/bin/activate"

python -m pip install --upgrade pip wheel
pip install --no-build-isolation -e "${ROOT_DIR}[dev]"

echo "[devcontainer] Installing frontend dependencies"
cd "${ROOT_DIR}/frontend"
npm install

echo "[devcontainer] Configuring local git hooks path"
cd "${ROOT_DIR}"
if [[ -d ".githooks" ]]; then
  git config core.hooksPath .githooks || true
fi

echo "[devcontainer] Ready"
