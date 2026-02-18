from __future__ import annotations

import importlib.util
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from youtube_success_ml.api.dependencies import (
    get_service,
    request_count_by_path,
    request_latency_sum_by_path,
)
from youtube_success_ml.mlops.registry import load_manifest, load_registry
from youtube_success_ml.schemas import (
    DriftCheckRequest,
    DriftCheckResponse,
    MlopsCapabilitiesResponse,
)

router = APIRouter(tags=["mlops"])


@router.get("/mlops/manifest")
def manifest():
    data = load_manifest()
    if data is None:
        raise HTTPException(status_code=404, detail="Manifest not found")
    return data


@router.get("/mlops/registry")
def registry():
    data = load_registry()
    if data is None:
        raise HTTPException(status_code=404, detail="Registry not found")
    return data


@router.post("/mlops/drift-check", response_model=DriftCheckResponse)
def drift_check(payload: DriftCheckRequest) -> DriftCheckResponse:
    service = get_service()
    try:
        result = service.drift_check(
            requests=payload.items,
            z_threshold=payload.z_threshold,
            min_frequency=payload.min_category_frequency,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return DriftCheckResponse(**result)


@router.get("/mlops/capabilities", response_model=MlopsCapabilitiesResponse)
def mlops_capabilities() -> MlopsCapabilitiesResponse:
    def _installed(module: str) -> bool:
        return importlib.util.find_spec(module) is not None

    return MlopsCapabilitiesResponse(
        experiment_tracking={
            "mlflow_installed": _installed("mlflow"),
            "wandb_installed": _installed("wandb"),
        },
        hpo={
            "optuna_installed": _installed("optuna"),
        },
        feature_store={
            "dvc_project_present": Path("dvc.yaml").exists(),
            "feast_repo_present": Path("feature_store/feast/feature_store.yaml").exists(),
        },
        orchestration={
            "prefect_installed": _installed("prefect"),
            "prefect_flow_present": Path("orchestration/prefect/retraining_flow.py").exists(),
        },
        monitoring={
            "prometheus_config_present": Path(
                "infra/monitoring/prometheus/prometheus.yml"
            ).exists(),
            "grafana_dashboards_present": Path(
                "infra/monitoring/grafana/dashboards/yts-api-observability.json"
            ).exists(),
        },
    )


@router.get("/metrics", response_class=PlainTextResponse)
def metrics():
    lines = [
        "# HELP http_requests_total Total number of requests by path",
        "# TYPE http_requests_total counter",
    ]
    for path in sorted(request_count_by_path):
        lines.append(f'http_requests_total{{path="{path}"}} {request_count_by_path[path]}')

    lines.extend(
        [
            "# HELP http_request_latency_seconds_sum Cumulative request latency by path",
            "# TYPE http_request_latency_seconds_sum counter",
        ]
    )
    for path in sorted(request_latency_sum_by_path):
        lines.append(
            f'http_request_latency_seconds_sum{{path="{path}"}} {request_latency_sum_by_path[path]:.6f}'
        )
    return "\n".join(lines) + "\n"
