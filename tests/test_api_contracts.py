from fastapi.testclient import TestClient

from youtube_success_ml.train import run_training


def _ensure_artifacts():
    run_training(run_maps=False)


def test_fastapi_predict_contract():
    _ensure_artifacts()

    from youtube_success_ml.api.fastapi_app import app

    client = TestClient(app)

    response = client.post(
        "/predict",
        json={
            "uploads": 500,
            "category": "Education",
            "country": "United States",
            "age": 6,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {
        "predicted_subscribers",
        "predicted_earnings",
        "predicted_growth",
    }
    assert body["predicted_subscribers"] >= 0


def test_fastapi_advanced_prediction_contracts():
    _ensure_artifacts()

    from youtube_success_ml.api.fastapi_app import app

    client = TestClient(app)

    batch = client.post(
        "/predict/batch",
        json={
            "items": [
                {"uploads": 200, "category": "Education", "country": "United States", "age": 4},
                {"uploads": 1400, "category": "Entertainment", "country": "India", "age": 9},
            ]
        },
    )
    assert batch.status_code == 200
    batch_body = batch.json()
    assert batch_body["summary"]["count"] == 2
    assert len(batch_body["records"]) == 2

    sim = client.post(
        "/predict/simulate",
        json={
            "category": "Music",
            "country": "India",
            "age": 7,
            "start_uploads": 100,
            "end_uploads": 300,
            "step": 100,
        },
    )
    assert sim.status_code == 200
    sim_body = sim.json()
    assert len(sim_body["points"]) == 3
    assert "best_uploads_by_growth" in sim_body

    rec = client.post(
        "/predict/recommendation",
        json={
            "uploads": 500,
            "category": "Education",
            "country": "United States",
            "age": 5,
        },
    )
    assert rec.status_code == 200
    rec_body = rec.json()
    assert "recommendations" in rec_body
    assert "cluster" in rec_body

    fi = client.get("/predict/feature-importance?target=subscribers&top_n=8")
    assert fi.status_code == 200
    fi_body = fi.json()
    assert fi_body["target"] == "subscribers"
    assert len(fi_body["records"]) == 8


def test_fastapi_ready_and_mlops_contract():
    _ensure_artifacts()

    from youtube_success_ml.api.fastapi_app import app

    client = TestClient(app)
    ready = client.get("/ready")
    manifest = client.get("/mlops/manifest")
    registry = client.get("/mlops/registry")
    capabilities = client.get("/mlops/capabilities")
    metrics = client.get("/metrics")

    assert ready.status_code == 200
    assert "ready" in ready.text
    assert manifest.status_code == 200
    assert "run_id" in manifest.json()
    assert registry.status_code == 200
    assert "active_run_id" in registry.json()
    assert capabilities.status_code == 200
    assert "experiment_tracking" in capabilities.json()
    assert metrics.status_code == 200
    assert "http_requests_total" in metrics.text


def test_fastapi_drift_check_contract():
    _ensure_artifacts()

    from youtube_success_ml.api.fastapi_app import app

    client = TestClient(app)
    drift = client.post(
        "/mlops/drift-check",
        json={
            "items": [
                {"uploads": 500, "category": "Education", "country": "United States", "age": 6},
                {
                    "uploads": 2_000_000,
                    "category": "UnknownEdgeCase",
                    "country": "Atlantis",
                    "age": 99,
                },
            ],
            "z_threshold": 2.5,
            "min_category_frequency": 0.01,
        },
    )
    assert drift.status_code == 200
    body = drift.json()
    assert "summary" in body
    assert "records" in body
    assert len(body["records"]) == 2


def test_fastapi_data_samples_contract():
    _ensure_artifacts()

    from youtube_success_ml.api.fastapi_app import app

    client = TestClient(app)
    raw = client.get("/data/raw-sample?limit=5")
    processed = client.get("/data/processed-sample?limit=5")

    assert raw.status_code == 200
    assert processed.status_code == 200
    assert len(raw.json()["records"]) == 5
    assert len(processed.json()["records"]) == 5
    assert "age" in processed.json()["records"][0]


def test_fastapi_analytics_endpoints_contract():
    _ensure_artifacts()

    from youtube_success_ml.api.fastapi_app import app

    client = TestClient(app)
    category_perf = client.get("/analytics/category-performance?top_n=8")
    upload_buckets = client.get("/analytics/upload-growth-buckets")

    assert category_perf.status_code == 200
    assert upload_buckets.status_code == 200
    assert len(category_perf.json()["records"]) >= 3
    assert len(upload_buckets.json()["records"]) >= 3


def test_flask_predict_contract():
    _ensure_artifacts()

    from youtube_success_ml.api.flask_app import app

    client = app.test_client()
    response = client.post(
        "/predict",
        json={
            "uploads": 1200,
            "category": "Entertainment",
            "country": "India",
            "age": 8,
        },
    )
    assert response.status_code == 200
    body = response.get_json()
    assert "predicted_subscribers" in body
    assert "predicted_earnings" in body
    assert "predicted_growth" in body


def test_flask_advanced_contracts():
    _ensure_artifacts()

    from youtube_success_ml.api.flask_app import app

    client = app.test_client()
    batch = client.post(
        "/predict/batch",
        json={
            "items": [
                {"uploads": 100, "category": "Music", "country": "India", "age": 3},
                {"uploads": 200, "category": "Education", "country": "United States", "age": 4},
            ]
        },
    )
    assert batch.status_code == 200
    assert batch.get_json()["summary"]["count"] == 2

    fi = client.get("/predict/feature-importance?target=subscribers&top_n=5")
    assert fi.status_code == 200
    assert len(fi.get_json()["records"]) == 5
