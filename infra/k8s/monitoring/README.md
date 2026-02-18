# Kubernetes Monitoring Overlay

Deploy Prometheus and Grafana for YouTube Success ML metrics in-cluster.

```bash
kubectl apply -k infra/k8s/monitoring
```

Port-forward:

```bash
kubectl -n yts-monitoring port-forward svc/prometheus 9090:9090
kubectl -n yts-monitoring port-forward svc/grafana 3001:3000
```
