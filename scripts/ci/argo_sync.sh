#!/usr/bin/env bash
set -euo pipefail

DEPLOY_STRATEGY="${1:?deploy strategy required (rolling|canary|bluegreen)}"

if ! command -v argocd >/dev/null 2>&1; then
  echo "argocd CLI not found. skipping sync" >&2
  exit 0
fi

APP_NAME="yts-${DEPLOY_STRATEGY}"

if command -v kubectl >/dev/null 2>&1; then
  bash infra/argocd/switch-strategy.sh "${DEPLOY_STRATEGY}"
fi

argocd app sync "${APP_NAME}" --prune
argocd app wait "${APP_NAME}" --health --sync --timeout 600
