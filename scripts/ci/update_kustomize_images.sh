#!/usr/bin/env bash
set -euo pipefail

DEPLOY_STRATEGY="${1:?deploy strategy required (rolling|canary|bluegreen)}"
API_IMAGE="${2:?api image required}"
FRONTEND_IMAGE="${3:?frontend image required}"

API_IMAGE_NAME="${API_IMAGE%:*}"
API_TAG="${API_IMAGE##*:}"
FRONTEND_IMAGE_NAME="${FRONTEND_IMAGE%:*}"
FRONTEND_TAG="${FRONTEND_IMAGE##*:}"

KUSTOMIZATION_PATH="infra/k8s/overlays/${DEPLOY_STRATEGY}/kustomization.yaml"

if [[ ! -f "${KUSTOMIZATION_PATH}" ]]; then
  echo "kustomization file not found: ${KUSTOMIZATION_PATH}" >&2
  exit 1
fi

tmp_file="$(mktemp)"
awk -v api_name="${API_IMAGE_NAME}" -v api_tag="${API_TAG}" -v frontend_name="${FRONTEND_IMAGE_NAME}" -v frontend_tag="${FRONTEND_TAG}" '
  /name: ghcr.io\/davidnguyen\/yts-api/ {
    print
    getline
    sub(/newName: .*/, "newName: " api_name)
    print
    getline
    sub(/newTag: .*/, "newTag: " api_tag)
    print
    next
  }
  /name: ghcr.io\/davidnguyen\/yts-frontend/ {
    print
    getline
    sub(/newName: .*/, "newName: " frontend_name)
    print
    getline
    sub(/newTag: .*/, "newTag: " frontend_tag)
    print
    next
  }
  { print }
' "${KUSTOMIZATION_PATH}" > "${tmp_file}"

mv "${tmp_file}" "${KUSTOMIZATION_PATH}"

echo "updated tags in ${KUSTOMIZATION_PATH}"
