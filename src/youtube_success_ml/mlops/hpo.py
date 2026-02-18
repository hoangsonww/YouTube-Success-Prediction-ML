from __future__ import annotations

import importlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from youtube_success_ml.config import TrainingConfig
from youtube_success_ml.models.supervised import FEATURE_COLUMNS, TARGET_COLUMNS


@dataclass(frozen=True)
class OptunaConfig:
    n_trials: int = 0
    timeout_seconds: int | None = None
    study_name: str = "yts-supervised-hpo"
    storage: str | None = None
    direction: str = "minimize"


@dataclass(frozen=True)
class OptunaResult:
    best_params: dict[str, Any]
    best_value: float
    artifact_path: Path


def _require_optuna() -> Any:
    try:
        return importlib.import_module("optuna")
    except ImportError as exc:
        raise RuntimeError(
            "Optuna is not installed. Install mlops extras: pip install -e '.[mlops]'"
        ) from exc


def _build_pipeline(config: TrainingConfig, max_depth: int | None) -> TransformedTargetRegressor:
    numeric_features = ["uploads", "age"]
    categorical_features = ["category", "country"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(steps=[("imputer", SimpleImputer(strategy="median"))]),
                numeric_features,
            ),
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("ohe", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_features,
            ),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=config.n_estimators,
        min_samples_leaf=config.min_samples_leaf,
        max_depth=max_depth,
        random_state=config.random_state,
        n_jobs=-1,
    )
    regressor = Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])

    return TransformedTargetRegressor(
        regressor=regressor,
        func=np.log1p,
        inverse_func=np.expm1,
    )


def run_supervised_hpo(
    df: pd.DataFrame,
    base_config: TrainingConfig,
    report_dir: Path,
    optuna_cfg: OptunaConfig,
) -> OptunaResult:
    if optuna_cfg.n_trials <= 0:
        raise ValueError("n_trials must be > 0")

    optuna = _require_optuna()
    target_col = TARGET_COLUMNS["subscribers"]
    X = df[FEATURE_COLUMNS].copy()
    y = df[target_col].to_numpy(dtype=float)

    def objective(trial):
        candidate = TrainingConfig(
            random_state=base_config.random_state,
            test_size=base_config.test_size,
            n_estimators=trial.suggest_int("n_estimators", 80, 420, step=20),
            min_samples_leaf=trial.suggest_int("min_samples_leaf", 1, 10),
            n_clusters=base_config.n_clusters,
            dbscan_eps=base_config.dbscan_eps,
            dbscan_min_samples=base_config.dbscan_min_samples,
        )
        max_depth = trial.suggest_int("max_depth", 6, 24)

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=candidate.test_size,
            random_state=candidate.random_state,
        )
        model = _build_pipeline(candidate, max_depth=max_depth)
        model.fit(X_train, y_train)
        pred = np.clip(model.predict(X_test), a_min=0, a_max=None)
        rmse = float(np.sqrt(mean_squared_error(y_test, pred)))
        return rmse

    sampler = optuna.samplers.TPESampler(seed=base_config.random_state)
    study = optuna.create_study(
        direction=optuna_cfg.direction,
        study_name=optuna_cfg.study_name,
        storage=optuna_cfg.storage,
        load_if_exists=True,
        sampler=sampler,
    )
    study.optimize(objective, n_trials=optuna_cfg.n_trials, timeout=optuna_cfg.timeout_seconds)

    report_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = report_dir / "optuna_study.json"
    payload = {
        "study_name": study.study_name,
        "best_params": study.best_params,
        "best_value": float(study.best_value),
        "n_trials": len(study.trials),
        "direction": study.direction.name,
    }
    artifact_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return OptunaResult(
        best_params={k: v for k, v in study.best_params.items()},
        best_value=float(study.best_value),
        artifact_path=artifact_path,
    )
