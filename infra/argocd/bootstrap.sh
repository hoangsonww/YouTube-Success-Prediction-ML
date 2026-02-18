#!/usr/bin/env bash
set -euo pipefail

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

kubectl apply -f infra/argocd/projects/yts-project.yaml
kubectl apply -f infra/argocd/apps/default/yts-rolling.yaml

echo "Argo CD bootstrap manifests applied."
echo "Default strategy app: yts-rolling"
echo "Use infra/argocd/switch-strategy.sh to move to canary or bluegreen."
