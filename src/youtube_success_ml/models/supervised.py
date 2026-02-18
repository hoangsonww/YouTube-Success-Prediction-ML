from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from youtube_success_ml.config import MODEL_DIR, TrainingConfig

FEATURE_COLUMNS = ["uploads", "category", "country", "age"]
TARGET_COLUMNS = {
    "subscribers": "subscribers",
    "earnings": "highest_yearly_earnings",
    "growth": "growth_target",
}


@dataclass
class SupervisedBundle:
    models: dict[str, Any]
    metrics: dict[str, dict[str, float]]
    metadata: dict[str, Any]


def _build_base_pipeline(config: TrainingConfig) -> Pipeline:
    numeric_features = ["uploads", "age"]
    categorical_features = ["category", "country"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                    ]
                ),
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
        random_state=config.random_state,
        n_jobs=-1,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )


def _evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": rmse,
        "r2": float(r2_score(y_true, y_pred)),
    }


def train_supervised_bundle(
    df: pd.DataFrame,
    config: TrainingConfig,
    model_dir: Path | None = None,
) -> SupervisedBundle:
    model_dir = model_dir or MODEL_DIR
    model_dir.mkdir(parents=True, exist_ok=True)

    X = df[FEATURE_COLUMNS].copy()
    models: dict[str, Any] = {}
    metrics: dict[str, dict[str, float]] = {}

    for key, target_col in TARGET_COLUMNS.items():
        y = df[target_col].to_numpy(dtype=float)

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=config.test_size,
            random_state=config.random_state,
        )

        base_pipeline = _build_base_pipeline(config)
        regressor = TransformedTargetRegressor(
            regressor=base_pipeline,
            func=np.log1p,
            inverse_func=np.expm1,
        )

        regressor.fit(X_train, y_train)
        pred = regressor.predict(X_test)
        pred = np.clip(pred, a_min=0, a_max=None)
        metrics[key] = _evaluate(y_test, pred)

        # Refit on all available rows for deployment.
        regressor.fit(X, y)
        models[key] = regressor

    metadata = {
        "feature_columns": FEATURE_COLUMNS,
        "categories": sorted(df["category"].dropna().unique().tolist()),
        "countries": sorted(df["country"].dropna().unique().tolist()),
    }

    bundle = SupervisedBundle(models=models, metrics=metrics, metadata=metadata)
    joblib.dump(bundle, model_dir / "supervised_bundle.joblib")
    return bundle


def load_supervised_bundle(model_dir: Path | None = None) -> SupervisedBundle:
    model_dir = model_dir or MODEL_DIR
    return joblib.load(model_dir / "supervised_bundle.joblib")


def predict_from_bundle(bundle: SupervisedBundle, payload: dict[str, Any]) -> dict[str, float]:
    X = pd.DataFrame([payload], columns=FEATURE_COLUMNS)
    subs = float(bundle.models["subscribers"].predict(X)[0])
    earn = float(bundle.models["earnings"].predict(X)[0])
    growth = float(bundle.models["growth"].predict(X)[0])
    return {
        "predicted_subscribers": max(subs, 0.0),
        "predicted_earnings": max(earn, 0.0),
        "predicted_growth": max(growth, 0.0),
    }


def batch_predict_from_bundle(
    bundle: SupervisedBundle, payloads: list[dict[str, Any]]
) -> list[dict[str, float]]:
    X = pd.DataFrame(payloads, columns=FEATURE_COLUMNS)
    subs = np.clip(bundle.models["subscribers"].predict(X), a_min=0, a_max=None)
    earn = np.clip(bundle.models["earnings"].predict(X), a_min=0, a_max=None)
    growth = np.clip(bundle.models["growth"].predict(X), a_min=0, a_max=None)

    return [
        {
            "predicted_subscribers": float(s),
            "predicted_earnings": float(e),
            "predicted_growth": float(g),
        }
        for s, e, g in zip(subs, earn, growth, strict=False)
    ]


def top_feature_importance(
    bundle: SupervisedBundle,
    target: str = "subscribers",
    top_n: int = 15,
) -> list[dict[str, float | str]]:
    if target not in TARGET_COLUMNS:
        raise ValueError(f"Unknown target '{target}'. Allowed: {sorted(TARGET_COLUMNS)}")

    transformed = bundle.models[target]
    pipeline = transformed.regressor_
    preprocessor = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]

    feature_names = preprocessor.get_feature_names_out().tolist()
    importances = model.feature_importances_

    rows = [
        {"feature": str(name), "importance": float(value)}
        for name, value in zip(feature_names, importances, strict=False)
    ]
    rows.sort(key=lambda r: r["importance"], reverse=True)
    return rows[: max(1, min(top_n, len(rows)))]
