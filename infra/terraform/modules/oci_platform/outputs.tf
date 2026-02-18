output "cluster_id" {
  value       = oci_containerengine_cluster.this.id
  description = "OKE cluster OCID."
}

output "cluster_endpoint" {
  value       = oci_containerengine_cluster.this.endpoints[0].public_endpoint
  description = "OKE public API endpoint."
}

output "api_container_repository" {
  value       = oci_artifacts_container_repository.api.display_name
  description = "OCI Registry repository name for API image."
}

output "frontend_container_repository" {
  value       = oci_artifacts_container_repository.frontend.display_name
  description = "OCI Registry repository name for frontend image."
}

output "artifacts_bucket" {
  value       = oci_objectstorage_bucket.artifacts.name
  description = "Object Storage bucket for model artifacts."
}
