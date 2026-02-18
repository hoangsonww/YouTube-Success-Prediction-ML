# Terraform Cloud Packs

This directory provisions production infrastructure for four cloud targets:

- AWS (`environments/aws`)
- GCP (`environments/gcp`)
- Azure (`environments/azure`)
- OCI (`environments/oci`)

## Table Of Contents

- [Document Metadata](#document-metadata)
- [Documentation Map](#documentation-map)
- [Module Pattern](#module-pattern)
- [Apply Flow](#apply-flow)
- [Notes](#notes)

## Document Metadata

| Field | Value |
| --- | --- |
| Document role | Terraform provisioning guide for cloud packs |
| Primary audience | Cloud/platform engineers and infrastructure operators |
| Last updated | February 18, 2026 |
| Environments | AWS, GCP, Azure, OCI |
| Module strategy | Shared tagging + provider-specific platform modules |

## Documentation Map

| Document | Scope | Use it when |
| --- | --- | --- |
| [`../../README.md`](../../README.md) | Platform-level bootstrap | You need end-to-end operational setup context |
| [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md) | CI/CD orchestration and rollout model | You need delivery pipeline dependencies |
| [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) | Multi-cloud topology rationale | You need architectural design context for IaC |
| [`../README.md`](../README.md) | Infrastructure stack index | You need infra navigation and quick references |
| [`../k8s/README.md`](../k8s/README.md) | Cluster runtime manifests | You need workload/runtime consumers of provisioned infra |

## Module Pattern

- `modules/global_tags`: shared tagging/labeling conventions.
- `modules/*_platform`: managed Kubernetes + container registry + artifact storage.

## Apply Flow

1. Choose a cloud environment root.
2. Copy `terraform.tfvars.example` to `terraform.tfvars`.
3. Configure backend block values (state bucket/container + lock settings).
4. Run:

```bash
terraform init
terraform plan
terraform apply
```

## Notes

- Backend values are placeholders and must be replaced before production use.
- Provider credentials are not stored in repo and must come from secure CI secrets.
- Validate each environment in isolated workspaces (dev/staging/prod).
