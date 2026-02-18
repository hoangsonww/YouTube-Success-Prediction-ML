output "cluster_name" {
  value       = google_container_cluster.this.name
  description = "GKE cluster name."
}

output "cluster_endpoint" {
  value       = google_container_cluster.this.endpoint
  description = "GKE control plane endpoint."
}

output "cluster_ca" {
  value       = google_container_cluster.this.master_auth[0].cluster_ca_certificate
  description = "Base64 CA cert for cluster auth."
}

output "artifact_registry_repo" {
  value       = google_artifact_registry_repository.containers.id
  description = "Artifact Registry repository ID."
}

output "artifacts_bucket" {
  value       = google_storage_bucket.artifacts.name
  description = "GCS bucket for model artifacts."
}
