#!/usr/bin/env bash
set -euo pipefail

STRATEGY="${1:?strategy required (rolling|canary|bluegreen)}"

case "${STRATEGY}" in
  rolling)
    kubectl apply -f infra/argocd/apps/default/yts-rolling.yaml
    kubectl delete -f infra/argocd/apps/strategies/yts-canary.yaml --ignore-not-found
    kubectl delete -f infra/argocd/apps/strategies/yts-bluegreen.yaml --ignore-not-found
    ;;
  canary)
    kubectl apply -f infra/argocd/apps/strategies/yts-canary.yaml
    kubectl delete -f infra/argocd/apps/default/yts-rolling.yaml --ignore-not-found
    kubectl delete -f infra/argocd/apps/strategies/yts-bluegreen.yaml --ignore-not-found
    ;;
  bluegreen)
    kubectl apply -f infra/argocd/apps/strategies/yts-bluegreen.yaml
    kubectl delete -f infra/argocd/apps/default/yts-rolling.yaml --ignore-not-found
    kubectl delete -f infra/argocd/apps/strategies/yts-canary.yaml --ignore-not-found
    ;;
  *)
    echo "unsupported strategy: ${STRATEGY}" >&2
    exit 1
    ;;
esac

echo "strategy switched to ${STRATEGY}"
