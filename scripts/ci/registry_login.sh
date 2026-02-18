#!/usr/bin/env bash
set -euo pipefail

CLOUD_PROVIDER="${1:?cloud provider required (aws|gcp|azure|oci)}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing required command: $1" >&2
    exit 1
  fi
}

case "${CLOUD_PROVIDER}" in
  aws)
    require_cmd aws
    require_cmd docker
    : "${AWS_REGION:?AWS_REGION is required}"
    : "${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
    AWS_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${AWS_REGISTRY}"
    echo "${AWS_REGISTRY}"
    ;;
  gcp)
    require_cmd gcloud
    require_cmd docker
    : "${GCP_REGION:?GCP_REGION is required}"
    : "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
    : "${GCP_ARTIFACT_REPO:?GCP_ARTIFACT_REPO is required}"
    GCP_REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPO}"
    gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet
    echo "${GCP_REGISTRY}"
    ;;
  azure)
    require_cmd az
    require_cmd docker
    : "${AZURE_ACR_NAME:?AZURE_ACR_NAME is required}"
    az acr login --name "${AZURE_ACR_NAME}"
    echo "${AZURE_ACR_NAME}.azurecr.io"
    ;;
  oci)
    require_cmd docker
    : "${OCI_REGION:?OCI_REGION is required}"
    : "${OCI_TENANCY_NAMESPACE:?OCI_TENANCY_NAMESPACE is required}"
    : "${OCI_USERNAME:?OCI_USERNAME is required}"
    : "${OCI_AUTH_TOKEN:?OCI_AUTH_TOKEN is required}"
    OCI_REGISTRY="${OCI_REGION}.ocir.io/${OCI_TENANCY_NAMESPACE}"
    echo "${OCI_AUTH_TOKEN}" | docker login "${OCI_REGION}.ocir.io" -u "${OCI_TENANCY_NAMESPACE}/${OCI_USERNAME}" --password-stdin
    echo "${OCI_REGISTRY}"
    ;;
  *)
    echo "unsupported cloud provider: ${CLOUD_PROVIDER}" >&2
    exit 1
    ;;
esac
