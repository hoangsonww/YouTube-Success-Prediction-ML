#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-yts-prod}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found. cannot promote blue/green rollouts" >&2
  exit 1
fi

kubectl argo rollouts promote yts-api -n "${NAMESPACE}"
kubectl argo rollouts promote yts-frontend -n "${NAMESPACE}"
