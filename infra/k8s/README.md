# Kubernetes Manifests

## Table Of Contents

- [Document Metadata](#document-metadata)
- [Documentation Map](#documentation-map)
- [Base](#base)
- [Overlays](#overlays)
- [Strategy Selection](#strategy-selection)

## Document Metadata

| Field | Value |
| --- | --- |
| Document role | Kubernetes runtime and strategy overlay reference |
| Primary audience | Platform engineers, SREs, release engineers |
| Last updated | February 18, 2026 |
| Runtime target namespace | `yts-prod` |
| Strategy modes | `rolling`, `canary`, `bluegreen` |

## Documentation Map

| Document | Scope | Use it when |
| --- | --- | --- |
| [`../../README.md`](../../README.md) | Platform runtime entrypoint | You need full-stack execution context |
| [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md) | Release strategy and rollout operations | You need deployment workflow guidance |
| [`../README.md`](../README.md) | Infrastructure index | You need infra-level navigation |
| [`../argocd/README.md`](../argocd/README.md) | GitOps strategy app wiring | You need Argo app alignment with overlays |
| [`../terraform/README.md`](../terraform/README.md) | Cloud foundations | You need IaC context behind cluster/runtime resources |

## Base

`base/` contains the default production runtime with standard Kubernetes Deployments (rolling strategy):

- API and frontend Deployments
- Services and Ingress
- HPA + PDB
- NetworkPolicy
- ConfigMap/Secret template
- PVC for artifacts

## Overlays

- `overlays/rolling`: rolling updates.
- `overlays/canary`: Argo Rollouts canary strategy.
- `overlays/bluegreen`: Argo Rollouts blue/green strategy.

Render:

```bash
kubectl kustomize infra/k8s/overlays/rolling
kubectl kustomize infra/k8s/overlays/canary
kubectl kustomize infra/k8s/overlays/bluegreen
```

## Strategy Selection

Only one strategy overlay should be actively synced in Argo CD at a time.
