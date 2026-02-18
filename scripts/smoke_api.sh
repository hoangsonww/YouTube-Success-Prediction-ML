#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8000}"

echo "[smoke] health"
curl -fsS "$BASE_URL/health" | tee /tmp/yts_health.json

echo "[smoke] ready"
curl -fsS "$BASE_URL/ready" | cat

echo "[smoke] predict"
curl -fsS -X POST "$BASE_URL/predict" \
  -H 'Content-Type: application/json' \
  -d '{"uploads":600,"category":"Education","country":"United States","age":7}' | tee /tmp/yts_predict.json

echo "[smoke] predict batch"
curl -fsS -X POST "$BASE_URL/predict/batch" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"uploads":200,"category":"Education","country":"United States","age":4},{"uploads":1100,"category":"Entertainment","country":"India","age":8}]}' \
  > /tmp/yts_predict_batch.json

echo "[smoke] simulate"
curl -fsS -X POST "$BASE_URL/predict/simulate" \
  -H 'Content-Type: application/json' \
  -d '{"category":"Music","country":"India","age":7,"start_uploads":100,"end_uploads":400,"step":100}' \
  > /tmp/yts_simulate.json

echo "[smoke] clusters"
curl -fsS "$BASE_URL/clusters/summary" > /tmp/yts_clusters.json

echo "[smoke] manifest"
curl -fsS "$BASE_URL/mlops/manifest" > /tmp/yts_manifest.json

echo "[smoke] drift check"
curl -fsS -X POST "$BASE_URL/mlops/drift-check" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"uploads":600,"category":"Education","country":"United States","age":7}]}' \
  > /tmp/yts_drift.json

echo "Smoke checks passed."
