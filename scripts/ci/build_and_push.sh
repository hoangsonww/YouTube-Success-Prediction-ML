#!/usr/bin/env bash
set -euo pipefail

REGISTRY_PREFIX="${1:?registry prefix required}"
IMAGE_TAG="${2:?image tag required}"

API_IMAGE="${REGISTRY_PREFIX}/yts-api:${IMAGE_TAG}"
FRONTEND_IMAGE="${REGISTRY_PREFIX}/yts-frontend:${IMAGE_TAG}"

echo "building ${API_IMAGE}"
docker build -f docker/Dockerfile.api -t "${API_IMAGE}" .

echo "building ${FRONTEND_IMAGE}"
docker build -f docker/Dockerfile.frontend -t "${FRONTEND_IMAGE}" .

echo "pushing ${API_IMAGE}"
docker push "${API_IMAGE}"

echo "pushing ${FRONTEND_IMAGE}"
docker push "${FRONTEND_IMAGE}"

echo "API_IMAGE=${API_IMAGE}"
echo "FRONTEND_IMAGE=${FRONTEND_IMAGE}"
