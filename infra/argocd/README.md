# Argo CD Configuration

## Table Of Contents

- [Document Metadata](#document-metadata)
- [Documentation Map](#documentation-map)
- [Files](#files)
- [Bootstrap](#bootstrap)
- [Switch Strategy](#switch-strategy)

## Document Metadata

| Field | Value |
| --- | --- |
| Document role | Argo CD GitOps application control guide |
| Primary audience | Platform engineers and release operators |
| Last updated | February 18, 2026 |
| Control scripts | `bootstrap.sh`, `switch-strategy.sh` |
| Deployment modes | Rolling, canary, blue/green |

## Documentation Map

| Document | Scope | Use it when |
| --- | --- | --- |
| [`../../README.md`](../../README.md) | Platform operations entrypoint | You need full platform context for release |
| [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md) | CI/CD and rollout strategy | You need end-to-end deployment workflow |
| [`../README.md`](../README.md) | Infrastructure stack map | You need infra-level overview and commands |
| [`../k8s/README.md`](../k8s/README.md) | Strategy overlay manifests | You need object-level runtime strategy details |
| [`../terraform/README.md`](../terraform/README.md) | Cloud environment provisioning | You need foundational cloud dependency context |

## Files

- `projects/yts-project.yaml`: Argo project scoping.
- `apps/default/yts-rolling.yaml`: default rolling app.
- `apps/strategies/yts-canary.yaml`: canary app.
- `apps/strategies/yts-bluegreen.yaml`: blue/green app.
- `bootstrap.sh`: project + default app bootstrap.
- `switch-strategy.sh`: enforce single active strategy app.

## Bootstrap

```bash
bash infra/argocd/bootstrap.sh
```

## Switch Strategy

```bash
bash infra/argocd/switch-strategy.sh canary
bash infra/argocd/switch-strategy.sh bluegreen
bash infra/argocd/switch-strategy.sh rolling
```
