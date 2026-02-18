from __future__ import annotations

import importlib
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


def _to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


@dataclass(frozen=True)
class ExperimentTrackingConfig:
    enable_mlflow: bool = False
    enable_wandb: bool = False
    strict: bool = False
    mlflow_tracking_uri: str | None = None
    mlflow_experiment: str = "youtube-success-ml"
    wandb_project: str = "youtube-success-ml"
    wandb_entity: str | None = None
    tags: dict[str, str] = field(default_factory=dict)

    @classmethod
    def from_env(cls) -> "ExperimentTrackingConfig":
        tags: dict[str, str] = {}
        for raw in os.getenv("YTS_EXPERIMENT_TAGS", "").split(","):
            if "=" not in raw:
                continue
            key, value = raw.split("=", 1)
            key = key.strip()
            value = value.strip()
            if key and value:
                tags[key] = value

        return cls(
            enable_mlflow=_to_bool(os.getenv("YTS_ENABLE_MLFLOW"), default=False),
            enable_wandb=_to_bool(os.getenv("YTS_ENABLE_WANDB"), default=False),
            strict=_to_bool(os.getenv("YTS_EXPERIMENT_TRACKING_STRICT"), default=False),
            mlflow_tracking_uri=os.getenv("MLFLOW_TRACKING_URI"),
            mlflow_experiment=os.getenv("MLFLOW_EXPERIMENT_NAME", "youtube-success-ml"),
            wandb_project=os.getenv("WANDB_PROJECT", "youtube-success-ml"),
            wandb_entity=os.getenv("WANDB_ENTITY"),
            tags=tags,
        )


@dataclass
class ExperimentTracker:
    cfg: ExperimentTrackingConfig
    run_name: str
    run_id: str
    _mlflow: Any | None = None
    _mlflow_run: Any | None = None
    _wandb: Any | None = None
    _wandb_run: Any | None = None
    warnings: list[str] = field(default_factory=list)

    @classmethod
    def start(
        cls,
        run_name: str,
        run_id: str,
        cfg: ExperimentTrackingConfig | None = None,
    ) -> "ExperimentTracker":
        tracker = cls(
            cfg=cfg or ExperimentTrackingConfig.from_env(), run_name=run_name, run_id=run_id
        )
        tracker._start_backends()
        return tracker

    def _load_optional_module(self, module_name: str) -> Any | None:
        try:
            return importlib.import_module(module_name)
        except ImportError:
            msg = (
                f"Optional dependency '{module_name}' is not installed; tracking backend disabled."
            )
            if self.cfg.strict:
                raise RuntimeError(msg) from None
            self.warnings.append(msg)
            return None

    def _start_backends(self) -> None:
        if self.cfg.enable_mlflow:
            self._mlflow = self._load_optional_module("mlflow")
            if self._mlflow is not None:
                if self.cfg.mlflow_tracking_uri:
                    self._mlflow.set_tracking_uri(self.cfg.mlflow_tracking_uri)
                self._mlflow.set_experiment(self.cfg.mlflow_experiment)
                self._mlflow_run = self._mlflow.start_run(run_name=self.run_name, tags=self._tags())
                self._mlflow.set_tag("run_id", self.run_id)

        if self.cfg.enable_wandb:
            self._wandb = self._load_optional_module("wandb")
            if self._wandb is not None:
                self._wandb_run = self._wandb.init(
                    project=self.cfg.wandb_project,
                    entity=self.cfg.wandb_entity,
                    name=self.run_name,
                    reinit=True,
                    config={"run_id": self.run_id},
                    tags=[f"{k}:{v}" for k, v in self._tags().items()],
                )

    def _tags(self) -> dict[str, str]:
        tags = dict(self.cfg.tags)
        tags.setdefault("project", "youtube-success-ml")
        tags.setdefault("run_id", self.run_id)
        return tags

    def log_params(self, params: dict[str, Any]) -> None:
        if self._mlflow is not None:
            self._mlflow.log_params(params)
        if self._wandb is not None:
            self._wandb.config.update(params, allow_val_change=True)

    def log_metrics(self, metrics: dict[str, float], step: int | None = None) -> None:
        if self._mlflow is not None:
            self._mlflow.log_metrics(metrics, step=step)
        if self._wandb is not None:
            payload = dict(metrics)
            if step is not None:
                payload["_step"] = step
            self._wandb.log(payload)

    def log_artifact(self, path: Path) -> None:
        if not path.exists():
            return
        if self._mlflow is not None:
            self._mlflow.log_artifact(str(path))
        if self._wandb is not None and self._wandb_run is not None:
            self._wandb_run.log_artifact(str(path))

    def log_artifacts(self, paths: list[Path]) -> None:
        for path in paths:
            self.log_artifact(path)

    def end(self) -> None:
        if self._mlflow is not None and self._mlflow_run is not None:
            self._mlflow.end_run()
            self._mlflow_run = None
        if self._wandb is not None and self._wandb_run is not None:
            self._wandb_run.finish()
            self._wandb_run = None
