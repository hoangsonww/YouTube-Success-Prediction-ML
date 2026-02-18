#!/usr/bin/env bash
set -euo pipefail

CLOUD_PROVIDER="${1:?cloud provider required (aws|gcp|azure|oci)}"
AUTO_APPLY="${2:-false}"

TF_DIR="infra/terraform/environments/${CLOUD_PROVIDER}"

if [[ ! -d "${TF_DIR}" ]]; then
  echo "terraform environment directory not found: ${TF_DIR}" >&2
  exit 1
fi

pushd "${TF_DIR}" >/dev/null
terraform init -input=false
terraform fmt -recursive
terraform validate
terraform plan -out=tfplan -input=false

if [[ "${AUTO_APPLY}" == "true" ]]; then
  terraform apply -input=false -auto-approve tfplan
else
  echo "AUTO_APPLY=false. plan generated at ${TF_DIR}/tfplan"
fi
popd >/dev/null
