# Architecture Document: YouTube Success Prediction ML Platform

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![pandas](https://img.shields.io/badge/pandas-Data%20Processing-150458?style=for-the-badge&logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-Numerical%20Computing-013243?style=for-the-badge&logo=numpy&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML%20Models-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)
![SciPy](https://img.shields.io/badge/SciPy-Scientific%20Computing-8CAAE6?style=for-the-badge&logo=scipy&logoColor=white)
![joblib](https://img.shields.io/badge/joblib-Model%20Serialization-4B5563?style=for-the-badge)
![Pydantic](https://img.shields.io/badge/Pydantic-Validation-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-API-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-ASGI%20Server-1F2937?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-API-000000?style=for-the-badge&logo=flask&logoColor=white)
![Plotly](https://img.shields.io/badge/Plotly-Visualization-3F4F75?style=for-the-badge&logo=plotly&logoColor=white)
![Folium](https://img.shields.io/badge/Folium-Geo%20Visualization-2E7D32?style=for-the-badge)
![python-dotenv](https://img.shields.io/badge/python--dotenv-Config-4B8BBE?style=for-the-badge)
![pytest](https://img.shields.io/badge/pytest-Testing-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)
![HTTPX](https://img.shields.io/badge/HTTPX-API%20Testing-5B21B6?style=for-the-badge)
![Ruff](https://img.shields.io/badge/Ruff-Lint%20%26%20Format-D7FF64?style=for-the-badge&logo=ruff&logoColor=111111)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-5FA04E?style=for-the-badge&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-Package%20Manager-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-Charts-0EA5E9?style=for-the-badge)
![ESLint](https://img.shields.io/badge/ESLint-Linting-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-Formatting-F7B93E?style=for-the-badge&logo=prettier&logoColor=111827)
![Docker](https://img.shields.io/badge/Docker-Containers-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Orchestration-1D63ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Kustomize](https://img.shields.io/badge/Kustomize-Overlays-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Argo CD](https://img.shields.io/badge/Argo%20CD-GitOps-EF7B4D?style=for-the-badge&logo=argo&logoColor=white)
![Argo Rollouts](https://img.shields.io/badge/Argo%20Rollouts-Canary%20%26%20Blue%2FGreen-EF7B4D?style=for-the-badge&logo=argo&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-IaC-844FBA?style=for-the-badge&logo=terraform&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=for-the-badge&logo=jenkins&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-Cloud-232F3E?style=for-the-badge&logo=task&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-Cloud-0078D4?style=for-the-badge&logo=micropython&logoColor=white)
![Oracle Cloud](https://img.shields.io/badge/Oracle%20Cloud-Cloud-F80000?style=for-the-badge&logo=circle&logoColor=white)
![GNU Make](https://img.shields.io/badge/GNU%20Make-Automation-6C6C6C?style=for-the-badge&logo=gnu&logoColor=white)
![Bash](https://img.shields.io/badge/Bash-Scripting-4EAA25?style=for-the-badge&logo=gnubash&logoColor=white)
![Mermaid](https://img.shields.io/badge/Mermaid-Diagrams-FF3670?style=for-the-badge&logo=mermaid&logoColor=white)

## Table Of Contents

- [Document Metadata](#document-metadata)
- [Documentation Map](#documentation-map)
- [1. Purpose](#1-purpose)
- [2. Scope](#2-scope)
- [3. Architectural Goals](#3-architectural-goals)
- [4. High-Level System Context](#4-high-level-system-context)
- [5. Container View](#5-container-view)
- [6. Component View: Backend](#6-component-view-backend)
- [7. Data Flow: Training Lifecycle](#7-data-flow-training-lifecycle)
- [8. Data Flow: Inference Request Lifecycle](#8-data-flow-inference-request-lifecycle)
- [9. Data Layer And Feature Engineering](#9-data-layer-and-feature-engineering)
- [9.1 Dataset Overview](#91-dataset-overview)
- [9.2 Canonical Transformation Rules](#92-canonical-transformation-rules)
- [9.3 Raw vs Processed Contracts](#93-raw-vs-processed-contracts)
- [10. Modeling Architecture](#10-modeling-architecture)
- [11. API Design](#11-api-design)
- [12. Frontend Architecture](#12-frontend-architecture)
- [13. MLOps Architecture](#13-mlops-architecture)
- [14. Observability](#14-observability)
- [15. Reliability And Failure Modes](#15-reliability-and-failure-modes)
- [16. Security Posture](#16-security-posture)
- [17. Deployment Topology](#17-deployment-topology)
- [18. CI/CD Model](#18-cicd-model)
- [19. Capacity And Scalability Notes](#19-capacity-and-scalability-notes)
- [20. Decisions And Tradeoffs](#20-decisions-and-tradeoffs)
- [21. Suggested Enterprise Evolution Path](#21-suggested-enterprise-evolution-path)
- [22. Source File Index](#22-source-file-index)
- [23. Operational Checklist](#23-operational-checklist)
- [24. Extended Interaction Charts](#24-extended-interaction-charts)
- [25. Data Contracts By Layer](#25-data-contracts-by-layer)
- [26. Deployment Variants](#26-deployment-variants)
- [27. Incident Response Flow](#27-incident-response-flow)
- [28. Trust Boundaries And Data Zones](#28-trust-boundaries-and-data-zones)
- [29. Model Promotion And Rollback Design](#29-model-promotion-and-rollback-design)
- [30. Request Routing By Capability](#30-request-routing-by-capability)
- [31. Multi-Cloud Platform Topology](#31-multi-cloud-platform-topology)
- [32. Strategy Control Plane](#32-strategy-control-plane)
- [33. Terraform Composition Model](#33-terraform-composition-model)
- [34. Release Promotion Sequence](#34-release-promotion-sequence)
- [35. Rollback And Recovery Path](#35-rollback-and-recovery-path)
- [36. Non-Functional Requirements Matrix](#36-non-functional-requirements-matrix)
- [37. Architecture Governance](#37-architecture-governance)

## Document Metadata

| Field | Value |
| --- | --- |
| Document role | System architecture and engineering design authority |
| Primary audience | Senior ML/backend/frontend/platform engineers and technical reviewers |
| Last updated | February 18, 2026 |
| Operational companion | [`README.md`](README.md) |
| Contract companion | [`API_REFERENCE.md`](API_REFERENCE.md) |

## Documentation Map

| Document | Scope | Use it when |
| --- | --- | --- |
| [`README.md`](README.md) | Operational bootstrap and runbook | You need setup, quality gates, and execution commands |
| [`API_REFERENCE.md`](API_REFERENCE.md) | Endpoint contracts and constraints | You need payload semantics and error behavior |
| [`MLOPS.md`](MLOPS.md) | Lineage and governance operations | You need manifest/registry/drift details |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Delivery and rollout strategy | You need CI/CD and release orchestration guidance |
| [`FRONTEND.md`](FRONTEND.md) | Client routes and API consumption model | You need frontend integration boundaries |
| [`infra/README.md`](infra/README.md) | Infrastructure topology index | You need infra-level navigation and quick commands |
| [`infra/k8s/README.md`](infra/k8s/README.md) | Kubernetes runtime objects | You are changing manifests, policies, or overlays |
| [`infra/argocd/README.md`](infra/argocd/README.md) | GitOps application control | You are switching sync strategy or app definitions |
| [`infra/terraform/README.md`](infra/terraform/README.md) | Cloud provisioning model | You are planning/applying infrastructure packs |

## 1. Purpose

This document describes the technical architecture of the YouTube Success Prediction ML Platform. It covers:

- system boundaries
- runtime components
- data and model lifecycles
- API and frontend integration
- MLOps lineage and observability
- operational reliability patterns

The architecture is designed to be portfolio-grade while staying executable in a local environment.

## 2. Scope

### In Scope

- Supervised inference for subscriber/earnings/growth predictions.
- Unsupervised clustering and archetype labeling.
- Country-level metrics and visualization-ready data delivery.
- FastAPI and Flask runtime services.
- Next.js frontend for interactive analytics.
- Training-time MLOps artifacts and registry.

### Out Of Scope

- multi-tenant identity and RBAC.
- distributed retraining orchestration.
- online feature store.
- managed model serving platform.

## 3. Architectural Goals

- Reproducibility: deterministic training metadata and artifact hashes.
- Operability: health/readiness endpoints plus metrics exposure.
- Modularity: clear separation between data, modeling, API, and UI layers.
- Replaceability: model and serving layers can evolve independently.
- Traceability: each training run tied to data fingerprint and config snapshot.

## 4. High-Level System Context

```mermaid
flowchart TB
    User[Product User] --> FE[Next.js Frontend]
    FE --> API[FastAPI Service]
    FE --> API2[Flask Service]

    API --> Models[(Model Artifacts)]
    API2 --> Models

    Train[Training CLI] --> Data[(Raw CSV Dataset)]
    Train --> Models
    Train --> Reports[(Metrics and Data Quality Reports)]
    Train --> Registry[(Manifest and Model Registry)]

    API --> Registry
    API2 --> Registry
```

## 5. Container View

```mermaid
flowchart LR
    subgraph Browser
        UI[Next.js App Routes]
    end

    subgraph Backend
        FAPI[FastAPI App]
        FLASK[Flask App]
        SVC[Predictor and Cluster Services]
        MLOPS[MLOps Registry Utilities]
    end

    subgraph ML
        TRAIN[train.py]
        SUP[Supervised Pipeline]
        CLU[Clustering Pipeline]
        MAP[Map Builders]
    end

    subgraph Storage
        CSV[(Global YouTube CSV)]
        ART[(artifacts/models)]
        REP[(artifacts/reports)]
        REG[(artifacts/mlops)]
    end

    UI --> FAPI
    UI --> FLASK
    FAPI --> SVC
    FLASK --> SVC
    SVC --> ART
    FAPI --> MLOPS

    TRAIN --> CSV
    TRAIN --> SUP
    TRAIN --> CLU
    TRAIN --> MAP
    SUP --> ART
    CLU --> ART
    MAP --> REP
    TRAIN --> REP
    TRAIN --> REG
```

## 6. Component View: Backend

```mermaid
flowchart TD
    App[FastAPI or Flask App] --> Router[Route Layer]
    Router --> Validate[Pydantic Request Validation]
    Router --> PredictorService
    Router --> ClusterService
    Router --> Analytics[Country and Sample Data Endpoints]
    Router --> MLOpsRoutes[Manifest Registry Metrics Readiness]

    PredictorService --> SupervisedBundle[(supervised_bundle.joblib)]
    ClusterService --> ClusteringBundle[(clustering_bundle.joblib)]

    Analytics --> Loader[Data Loader]
    Loader --> CSV[(Raw Dataset)]

    MLOpsRoutes --> Manifest[(training_manifest.json)]
    MLOpsRoutes --> Registry[(model_registry.json)]
```

## 7. Data Flow: Training Lifecycle

```mermaid
sequenceDiagram
    participant CLI as train.py
    participant Loader as data.loader
    participant Sup as models.supervised
    participant Clu as models.clustering
    participant Maps as visualization.maps
    participant Quality as mlops.quality
    participant Registry as mlops.registry
    participant Artifacts as artifacts/*

    CLI->>Loader: load_raw_dataset()
    CLI->>Loader: load_dataset()

    CLI->>Sup: train_supervised_bundle(df, config)
    Sup-->>Artifacts: supervised_bundle.joblib

    CLI->>Clu: train_clustering_bundle(df, config)
    Clu-->>Artifacts: clustering_bundle.joblib + clustered_channels.csv

    CLI->>Maps: export_map_assets(df)
    Maps-->>Artifacts: map html outputs

    CLI->>Quality: build_data_quality_report(raw_df, processed_df)
    Quality-->>Artifacts: data_quality_report.json

    CLI->>Registry: build_training_manifest(...)
    Registry-->>Artifacts: training_manifest.json
    CLI->>Registry: update_registry(manifest)
    Registry-->>Artifacts: model_registry.json
```

## 8. Data Flow: Inference Request Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant FE as Next.js
    participant API as FastAPI
    participant Schema as Pydantic Schema
    participant Svc as PredictorService
    participant Model as SupervisedBundle

    User->>FE: Submit uploads/category/country/age
    FE->>API: POST /predict
    API->>Schema: Validate payload
    API->>Svc: predict(request)
    Svc->>Model: models[target].predict(features)
    Model-->>Svc: subscribers/earnings/growth
    Svc-->>API: formatted response
    API-->>FE: JSON
    FE-->>User: Render prediction cards
```

## 9. Data Layer And Feature Engineering

### 9.1 Dataset Overview

Primary source dataset:

- path resolution: `resolve_data_path()` in `src/youtube_success_ml/data/loader.py`
- default source file: `data/Global YouTube Statistics.csv`
- optional override: `YTS_DATA_PATH`
- encoding: `latin-1`
- row count: `995`
- raw column count: `28`

Processed training frame:

- row count: `995`
- processed column count: `30`
- engineered columns include `age` and `growth_target`

Dataset domains:

| Domain | Examples |
| --- | --- |
| Channel identity and taxonomy | `youtuber`, `title`, `channel_type`, `category`, `country`, `abbreviation` |
| Core performance | `uploads`, `subscribers`, `video_views`, `video_views_for_the_last_30_days` |
| Monetization | `lowest_monthly_earnings`, `highest_monthly_earnings`, `lowest_yearly_earnings`, `highest_yearly_earnings` |
| Growth and lifecycle | `subscribers_for_last_30_days`, `created_year`, `created_month`, `created_date`, engineered `age`, engineered `growth_target` |
| Geo and socio-economic context | `latitude`, `longitude`, `population`, `urban_population`, `unemployment_rate`, `gross_tertiary_education_enrollment_pct` |

Feature/target contract for supervised inference:

- features: `uploads`, `category`, `country`, `age`
- targets: `subscribers`, `highest_yearly_earnings`, `growth_target`

### 9.2 Canonical Transformation Rules

Defined in `src/youtube_success_ml/data/loader.py`:

- normalize column names to snake_case.
- coerce known numeric columns with `errors='coerce'`.
- fill `country`, `category`, `abbreviation` nulls.
- engineer `age = current_year - created_year` clipped to non-negative.
- derive `growth_target = subscribers_for_last_30_days`.
- enforce non-negative clipping for key numeric targets.

### 9.3 Raw vs Processed Contracts

- raw contract endpoint: `/data/raw-sample`
- processed contract endpoint: `/data/processed-sample`

This split makes preprocessing explicit to product and stakeholders.

## 10. Modeling Architecture

### Supervised Stack

Implementation: `src/youtube_success_ml/models/supervised.py`

- Feature pipeline:
  - numeric imputation for `uploads` and `age`
  - categorical imputation and one-hot encoding for `category` and `country`
- Regressor:
  - `RandomForestRegressor`
- Target transform:
  - `TransformedTargetRegressor` with `log1p/expm1`
- Targets:
  - subscribers
  - yearly earnings
  - 30-day growth
- Evaluation metrics:
  - MAE
  - RMSE
  - R2

### Clustering Stack

Implementation: `src/youtube_success_ml/models/clustering.py`

- KMeans pipeline:
  - `StandardScaler` + `KMeans`
- DBSCAN pipeline:
  - `StandardScaler` + `DBSCAN`
- Profile generation:
  - aggregate per cluster (`avg_uploads`, `avg_subscribers`, `avg_earnings`, `avg_growth`)
- Archetype naming logic:
  - highest growth => `Viral entertainers`
  - highest earnings per upload => `High earning low upload`
  - high uploads relative to growth => `High upload low growth`
  - remaining => `Consistent educators`

## 11. API Design

### FastAPI Endpoints

- `GET /health`
- `GET /ready`
- `POST /predict`
- `POST /predict/batch`
- `POST /predict/simulate`
- `POST /predict/recommendation`
- `GET /predict/feature-importance`
- `GET /clusters/summary`
- `GET /maps/country-metrics`
- `GET /data/raw-sample`
- `GET /data/processed-sample`
- `GET /analytics/category-performance`
- `GET /analytics/upload-growth-buckets`
- `GET /mlops/manifest`
- `GET /mlops/registry`
- `POST /mlops/drift-check`
- `GET /metrics`

### Flask Endpoints

Equivalent functional prediction, analytics, and MLOps endpoints are exposed via Flask for framework portability.
Prometheus-style metrics are implemented in FastAPI.

### Readiness Strategy

`/ready` checks artifact existence through `check_artifacts_ready()`.

If critical artifacts are missing, service reports not-ready state, allowing load balancers or orchestrators to block traffic.

## 12. Frontend Architecture

### Routes

- `/` main dashboard
- `/visualizations/charts` analytics + raw/processed data comparisons
- `/intelligence/lab` simulation, recommendation, feature importance, and drift analysis
- `/wiki` embedded project wiki route
- `/wiki/index.html` standalone static wiki landing page

### Client Data Access

`frontend/lib/api.ts` centralizes typed API requests and transport error handling.

### UI Composition

- composable chart + table sections
- typed data contracts in `frontend/lib/types.ts`
- progressive loading and error display for asynchronous calls
- dedicated responsive navigation and layout shell for desktop/mobile parity

### SEO And Metadata Integration

- global metadata and social previews in `frontend/app/layout.tsx`
- robots and sitemap generation in `frontend/app/robots.ts` and `frontend/app/sitemap.ts`
- web manifest in `frontend/app/manifest.ts`
- favicon and icon asset pipeline via `frontend/public/`

## 13. MLOps Architecture

### Artifact Lineage

```mermaid
flowchart LR
    D[Dataset SHA256] --> M[training_manifest.json]
    C[Training Config Snapshot] --> M
    R[Model and Report Artifact Hashes] --> M
    M --> G[model_registry.json]
    G --> A[active_run_id]
```

### Outputs

- metrics report
- data quality report
- training manifest
- model registry with active run pointer

### Operational Benefits

- reproducible run tracing
- easier rollback decisions
- audit-friendly history of model state transitions

## 14. Observability

### Implemented

- health endpoint
- readiness endpoint
- path-level request counters and cumulative latency (`/metrics`)
- process-time response header (`X-Process-Time-Seconds`)

### Recommended Next (Not Yet Implemented)

- distributed tracing exporter
- structured logging sink
- model performance telemetry from live prediction outcomes

## 15. Reliability And Failure Modes

### Failure: Missing Artifacts

Symptom:

- `/predict` returns service unavailable.

Mitigation:

- run training pipeline.
- verify `/ready` returns HTTP 200.

### Failure: Input Schema Drift

Symptom:

- validation errors on `/predict`.

Mitigation:

- strict Pydantic contract.
- frontend type alignment in `frontend/lib/types.ts`.

### Failure: Dataset Parsing Issues

Symptom:

- load or coercion errors.

Mitigation:

- explicit encoding and numeric coercion strategy in loader.

## 16. Security Posture

### Implemented

- schema-level input validation.
- bounded sample limits on raw/processed data endpoints.

### Recommended Hardening

- auth and token validation.
- rate limiting and request throttling.
- network policy and TLS termination.
- secret management with environment or vault integration.

## 17. Deployment Topology

```mermaid
flowchart TB
    subgraph Runtime
        LB[Ingress or Reverse Proxy]
        FE[Next.js Container]
        API[FastAPI Container]
    end

    subgraph Storage
        Artifacts[(Persistent Volume: artifacts)]
        Data[(Dataset Volume)]
    end

    LB --> FE
    LB --> API
    API --> Artifacts
    API --> Data
```

### Local Container Stack

- `docker/Dockerfile.api`
- `docker/Dockerfile.frontend`
- `docker-compose.yml`

## 18. CI/CD Model

This repository supports two complementary CI/CD planes:

- Pull request validation with GitHub Actions (`.github/workflows/ci.yml`)
- Release delivery with Jenkins + Argo CD + Argo Rollouts (`Jenkinsfile`, `infra/argocd`, `infra/k8s/overlays`)

Pipeline responsibilities:

- GitHub Actions:
  - Python dependency install, training pipeline execution, and `pytest`
  - frontend install, lint, and production build
- Jenkins:
  - repeat quality gates (train/test/lint/build)
  - container build/push to cloud registry
  - overlay image updates for selected rollout strategy
  - terraform plan/apply orchestration per cloud provider
  - Argo CD sync and optional blue/green promotion gate

This split keeps PR quality checks fast while preserving production-grade release controls.

<p align="center">
  <img src="images/gh.png" alt="GitHub Actions Workflow" width="100%">
</p>

## 19. Capacity And Scalability Notes

### Current Runtime Profile

- batch training on local CSV.
- in-memory inference with preloaded artifacts.
- stateless API process except filesystem artifact reads.

### Horizontal Scaling

- API can scale horizontally if artifact directory is shared or baked into immutable image.
- frontend is static-app friendly and cacheable.

### Vertical Scaling

- train-time forest size and clustering config tunable via env vars.
- CPU-bound inference can be optimized with model simplification or serving workers.

## 20. Decisions And Tradeoffs

- RandomForest chosen for robust nonlinear performance on mixed feature types and small/medium dataset size.
- separate target models for clarity and independent metric tracking.
- filesystem-based registry chosen for simplicity and portability in local/portfolio contexts.
- dual API frameworks included to demonstrate framework portability and service abstraction.

## 21. Suggested Enterprise Evolution Path

- replace local registry files with managed model registry.
- add feature store for offline/online parity.
- add canary release process for promoted models.
- add data drift checks and scheduled retraining pipelines.
- add SLO dashboards and alerting tied to `/metrics` and model KPI regressions.

## 22. Source File Index

Core files:

- `src/youtube_success_ml/train.py`
- `src/youtube_success_ml/data/loader.py`
- `src/youtube_success_ml/models/supervised.py`
- `src/youtube_success_ml/models/clustering.py`
- `src/youtube_success_ml/api/fastapi_app.py`
- `src/youtube_success_ml/api/flask_app.py`
- `src/youtube_success_ml/mlops/quality.py`
- `src/youtube_success_ml/mlops/registry.py`
- `frontend/app/page.tsx`
- `frontend/app/visualizations/charts/page.tsx`
- `frontend/app/intelligence/lab/page.tsx`
- `frontend/app/wiki/page.tsx`
- `frontend/public/wiki/index.html`
- `.devcontainer/devcontainer.json`
- `.devcontainer/post-create.sh`
- `scripts/format_all.sh`
- `scripts/format_prettier.sh`
- `scripts/format_python.sh`

## 23. Operational Checklist

Before release:

- run training successfully
- verify `/ready` is healthy
- run full pytest suite
- run frontend lint and build
- confirm manifest and registry updated
- confirm smoke test passes against deployed API


## 24. Extended Interaction Charts

### API Capability Topology

```mermaid
flowchart LR
    Client[Client Apps] --> H["/health"]
    Client --> R["/ready"]

    Client --> P["/predict"]
    Client --> PB["/predict/batch"]
    Client --> PS["/predict/simulate"]
    Client --> PR["/predict/recommendation"]
    Client --> FI["/predict/feature-importance"]

    Client --> CS["/clusters/summary"]
    Client --> CM["/maps/country-metrics"]
    Client --> RS["/data/raw-sample"]
    Client --> PSM["/data/processed-sample"]

    Client --> MF["/mlops/manifest"]
    Client --> MR["/mlops/registry"]
    Client --> DC["/mlops/drift-check"]
    Client --> MT["/metrics"]

    P --> SVC[IntelligenceService]
    PB --> SVC
    PS --> SVC
    PR --> SVC
    FI --> SVC
    CS --> SVC
    DC --> SVC
```

### Internal Service Collaboration

```mermaid
sequenceDiagram
    participant Router as API Router
    participant IS as IntelligenceService
    participant SB as SupervisedBundle
    participant CB as ClusteringBundle
    participant BL as Drift Baseline

    Router->>IS: predict / batch / simulate / recommendation
    IS->>SB: run target regressors
    SB-->>IS: subscribers, earnings, growth

    IS->>CB: cluster projection for recommendation
    CB-->>IS: cluster_id, archetype

    Router->>IS: drift_check(items)
    IS->>BL: compare distributions
    BL-->>IS: severity records + summary
    IS-->>Router: typed response payload
```

### Failure Handling Matrix

```mermaid
flowchart TD
    A[Incoming Request] --> B{Validation OK?}
    B -- No --> E[400 Validation Error]
    B -- Yes --> C{Artifacts Ready?}
    C -- No --> F[503 Service Unavailable]
    C -- Yes --> D{Endpoint Logic Success?}
    D -- No --> G[4xx/5xx with structured detail]
    D -- Yes --> H[200 Successful Response]
```

## 25. Data Contracts By Layer

### Inference Input Contract

```mermaid
classDiagram
    class PredictionRequest {
      +int uploads
      +string category
      +string country
      +int age
    }

    class PredictionResponse {
      +float predicted_subscribers
      +float predicted_earnings
      +float predicted_growth
    }

    PredictionRequest --> PredictionResponse
```

### Artifact Contract

```mermaid
classDiagram
    class TrainingManifest {
      +string run_id
      +string timestamp_utc
      +string data_sha256
      +object training_config
      +object metrics
      +object artifact_hashes
      +object artifact_paths
    }

    class ModelRegistry {
      +string active_run_id
      +list runs
    }

    TrainingManifest --> ModelRegistry : updates active run
```

## 26. Deployment Variants

```mermaid
flowchart LR
    subgraph LocalDev
      DEVFE[Next.js dev server]
      DEVAPI[FastAPI local process]
      DEVART[(Local artifacts)]
    end

    subgraph Containerized
      CFE[Frontend container]
      CAPI[API container]
      CART[(Mounted artifacts volume)]
    end

    DEVFE --> DEVAPI
    DEVAPI --> DEVART

    CFE --> CAPI
    CAPI --> CART
```

## 27. Incident Response Flow

```mermaid
sequenceDiagram
    participant Alert as Monitoring Alert
    participant SRE as Operator
    participant API as Service
    participant MLOPS as Manifest/Registry

    Alert->>SRE: Elevated error or drift risk
    SRE->>API: Check /ready and /metrics
    SRE->>API: Check /mlops/drift-check
    API-->>SRE: Drift severity and readiness
    SRE->>MLOPS: Inspect active run and artifact hashes
    SRE->>API: Redeploy or retrain decision
```

## 28. Trust Boundaries And Data Zones

```mermaid
flowchart LR
    subgraph PublicZone
      U[External User]
      B[Browser]
    end

    subgraph AppZone
      FE[Frontend Service]
      API[API Service]
    end

    subgraph DataZone
      RAW[(Raw Dataset)]
      ART[(Artifacts)]
      META[(Manifest/Registry)]
    end

    U --> B
    B --> FE
    FE --> API
    API --> ART
    API --> META
    API --> RAW
```

Boundary assumptions:

- Public zone is untrusted.
- App zone enforces schema validation and readiness checks.
- Data zone contains persistent assets and should be restricted to service principals.

## 29. Model Promotion And Rollback Design

```mermaid
sequenceDiagram
    participant Train as Training Pipeline
    participant Manifest as training_manifest.json
    participant Registry as model_registry.json
    participant API as Inference API
    participant Ops as Operator

    Train->>Manifest: write run metadata + hashes
    Train->>Registry: append run, set active_run_id
    API->>Registry: read active_run_id
    API->>Manifest: verify artifact alignment
    Ops->>Registry: set prior run (rollback scenario)
    API->>Registry: reload active run on restart
```

## 30. Request Routing By Capability

```mermaid
flowchart TD
    IN[Incoming HTTP Request] --> R1{Path Group}
    R1 -- health --> H[health router]
    R1 -- predict --> P[predictions router]
    R1 -- analytics --> A[analytics router]
    R1 -- mlops --> M[mlops router]

    P --> S[IntelligenceService]
    A --> L[data.loader + visualization]
    M --> REG[mlops.registry + drift]
```

This routing split is the primary structural refactor that makes the API easier to scale and maintain.

## 31. Multi-Cloud Platform Topology

```mermaid
flowchart TB
    subgraph ControlPlane[CI/CD Control Plane]
      J[Jenkins]
      G[GitOps Repo]
      ACD[Argo CD]
    end

    subgraph CloudA[AWS]
      EKS[EKS]
      ECR[ECR]
      S3[S3 Artifacts]
    end

    subgraph CloudB[GCP]
      GKE[GKE]
      GAR[Artifact Registry]
      GCS[GCS Artifacts]
    end

    subgraph CloudC[Azure]
      AKS[AKS]
      ACR[ACR]
      BLOB[Blob Artifacts]
    end

    subgraph CloudD[OCI]
      OKE[OKE]
      OCIR[OCIR]
      OBJ[Object Storage]
    end

    J --> G
    G --> ACD

    J --> ECR
    J --> GAR
    J --> ACR
    J --> OCIR

    ACD --> EKS
    ACD --> GKE
    ACD --> AKS
    ACD --> OKE

    EKS --> S3
    GKE --> GCS
    AKS --> BLOB
    OKE --> OBJ
```

## 32. Strategy Control Plane

```mermaid
flowchart LR
    Select[Deployment Strategy Parameter] --> Overlay[Kustomize Overlay]
    Overlay --> ArgoApp[Argo Application]
    ArgoApp --> Runtime{Runtime Object Type}

    Runtime -- rolling --> KDeployment[Kubernetes Deployment]
    Runtime -- canary --> KRolloutCanary[Argo Rollout Canary]
    Runtime -- bluegreen --> KRolloutBG[Argo Rollout BlueGreen]
```

Key design:

- One runtime namespace (`yts-prod`) and one baseline service contract.
- Strategy decides controller behavior, not app code.
- Frontend and API move together under the same release tag.

## 33. Terraform Composition Model

```mermaid
flowchart TD
    ENV[Environment Root] --> TAGS[global_tags module]
    ENV --> PLATFORM[cloud platform module]

    PLATFORM --> K8S[Managed Kubernetes]
    PLATFORM --> REG[Container Registry]
    PLATFORM --> OBJ[Artifact Storage]

    TAGS --> K8S
    TAGS --> REG
    TAGS --> OBJ
```

Root modules:

- `infra/terraform/environments/aws`
- `infra/terraform/environments/gcp`
- `infra/terraform/environments/azure`
- `infra/terraform/environments/oci`

Reusable modules:

- `infra/terraform/modules/global_tags`
- `infra/terraform/modules/aws_platform`
- `infra/terraform/modules/gcp_platform`
- `infra/terraform/modules/azure_platform`
- `infra/terraform/modules/oci_platform`

## 34. Release Promotion Sequence

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CI as Jenkins
    participant Reg as Cloud Registry
    participant GitOps as Overlay Repo
    participant Argo as Argo CD
    participant K8s as Cluster

    Dev->>CI: push commit
    CI->>CI: train + test + frontend build
    CI->>Reg: push yts-api + yts-frontend image tags
    CI->>GitOps: update overlay image references
    CI->>Argo: sync strategy app
    Argo->>K8s: apply manifests
    K8s-->>Argo: health + rollout status
```

## 35. Rollback And Recovery Path

```mermaid
flowchart TD
    Alert[Alert: SLO or health regression] --> Decision{Deployment Strategy?}
    Decision -- rolling --> RollBackDeploy[kubectl rollout undo deployment]
    Decision -- canary --> AbortCanary[kubectl argo rollouts abort]
    Decision -- bluegreen --> PromoteStable[keep active service on stable ReplicaSet]

    RollBackDeploy --> Verify[Verify /health and /ready]
    AbortCanary --> Verify
    PromoteStable --> Verify
```

Recovery invariants:

- health endpoints remain strategy-agnostic.
- rollback does not require data schema changes.
- model artifacts remain backward-compatible via manifest/registry lineage.

## 36. Non-Functional Requirements Matrix

| Dimension | Current implementation | Target/SLO guidance | Primary verification |
| --- | --- | --- | --- |
| Availability | Health and readiness endpoints with deployment rollback paths | `>= 99.5%` monthly API availability for single-region production | `/health`, `/ready`, rollout status checks |
| Reliability | Artifact readiness gating and versioned registry | Zero silent startup with missing artifacts | Readiness gate and startup smoke tests |
| Performance | FastAPI async serving and lightweight feature preprocessing | P95 prediction latency < 300ms under normal load | k6/Locust load testing, Prometheus histograms |
| Scalability | Kubernetes HPA, canary/bluegreen overlays | Horizontal scaling based on CPU and request volume | HPA metrics, cluster autoscaler events |
| Security | Network policies, secret templates, no embedded cloud creds | Least privilege across runtime and CI identities | IaC review, container scan, secret policy checks |
| Observability | Prometheus endpoint and drift-check diagnostics | End-to-end golden signals + model-risk signal visibility | `/metrics`, drift reports, alerting dashboards |
| Maintainability | Layered modules with domain-separated docs | Low change friction with synchronized docs and tests | PR checklist and CI quality gates |

## 37. Architecture Governance

Architecture changes follow an ADR-style workflow, even when ADR files are lightweight and embedded in pull request context.

Governance rules:

- Any new API domain or endpoint family requires updates to `API_REFERENCE.md` and Section 11 of this document.
- Any model feature/target/schema change requires updates to data contracts (Section 25), `README.md`, and `MLOPS.md`.
- Any runtime topology change (Kubernetes, Argo, Terraform) requires updates to Section 17/18/31+ and relevant `infra/*` docs.
- Breaking behavior changes must include migration notes in `README.md` and deployment rollback notes in `DEPLOYMENT.md`.

```mermaid
flowchart TD
    Proposal[Architecture Change Proposal] --> Impact[Impact Analysis]
    Impact --> ADR[ADR or PR Design Note]
    ADR --> Impl[Implementation]
    Impl --> Validation[Tests + Runtime Validation]
    Validation --> Docs[Documentation Synchronization]
    Docs --> Review[Architecture Review]
    Review --> Release[Release Approval]
```
