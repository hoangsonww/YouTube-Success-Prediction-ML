# Monitoring Stack (Prometheus + Grafana)

This directory provides in-repo monitoring deployment assets for API telemetry:

- Prometheus scrape/alert configuration
- Grafana datasource + dashboard provisioning
- Local Docker Compose stack and Kubernetes manifests

## Local Stack

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

Endpoints:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001` (default credentials: `admin` / `admin`)

## Kubernetes Stack

```bash
kubectl apply -k infra/k8s/monitoring
```

## Notes

- Prometheus scrapes `GET /metrics` from the API service.
- Dashboard is provisioned automatically from `grafana/dashboards`.
