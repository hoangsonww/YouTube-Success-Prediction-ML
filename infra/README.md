# Infrastructure Stack

This directory contains the production infrastructure and delivery stack for YouTube Success Prediction ML.

## Table Of Contents

- [Document Metadata](#document-metadata)
- [Documentation Map](#documentation-map)
- [Structure](#structure)
- [Deployment Strategies](#deployment-strategies)
- [Cloud Packs](#cloud-packs)
- [Quick Commands](#quick-commands)

## Document Metadata

| Field | Value |
| --- | --- |
| Document role | Infrastructure stack index and command entrypoint |
| Primary audience | Platform engineers and cloud operators |
| Last updated | February 18, 2026 |
| Coverage | Kubernetes, Argo CD, Terraform cloud packs |
| Operational scope | Multi-cloud production infrastructure |

## Documentation Map

| Document | Scope | Use it when |
| --- | --- | --- |
| [`../README.md`](../README.md) | Platform-level operations | You need end-to-end execution and quality gates |
| [`../DEPLOYMENT.md`](../DEPLOYMENT.md) | Deployment runbook | You need CI/CD or rollout process details |
| [`../ARCHITECTURE.md`](../ARCHITECTURE.md) | System topology rationale | You need architectural context for infra changes |
| [`k8s/README.md`](k8s/README.md) | Kubernetes manifests and overlays | You are editing cluster runtime resources |
| [`argocd/README.md`](argocd/README.md) | GitOps app orchestration | You are managing strategy app synchronization |
| [`terraform/README.md`](terraform/README.md) | Cloud provisioning packs | You are planning/applying infrastructure changes |
| [`monitoring/README.md`](monitoring/README.md) | Prometheus/Grafana stack | You are enabling observability dashboards and alerts |

## Structure

```text
infra/
|-- argocd/
|   |-- apps/
|   |-- projects/
|   |-- bootstrap.sh
|   `-- switch-strategy.sh
|-- k8s/
|   |-- base/
|   |-- overlays/
|   `-- monitoring/
|-- monitoring/
|   |-- prometheus/
|   `-- grafana/
`-- terraform/
    |-- modules/
    `-- environments/
```

## Deployment Strategies

- `rolling`: Standard Kubernetes `Deployment` rolling updates.
- `canary`: Argo Rollouts canary steps with readiness analysis.
- `bluegreen`: Argo Rollouts blue/green with manual promotion gate.

## Cloud Packs

- `aws`: EKS + ECR + S3
- `gcp`: GKE + Artifact Registry + GCS
- `azure`: AKS + ACR + Blob Storage
- `oci`: OKE + OCIR repos + Object Storage

## Quick Commands

Render Kubernetes manifests:

```bash
kubectl kustomize infra/k8s/overlays/rolling
kubectl kustomize infra/k8s/overlays/canary
kubectl kustomize infra/k8s/overlays/bluegreen
```

Bootstrap Argo CD project + default app:

```bash
bash infra/argocd/bootstrap.sh
```

Switch strategy app:

```bash
bash infra/argocd/switch-strategy.sh canary
```

Terraform example (AWS):

```bash
cd infra/terraform/environments/aws
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
```

Monitoring stack:

```bash
docker compose -f docker-compose.monitoring.yml up -d
kubectl apply -k infra/k8s/monitoring
```
