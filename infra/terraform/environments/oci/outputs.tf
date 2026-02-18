output "cluster_id" {
  value = module.platform.cluster_id
}

output "cluster_endpoint" {
  value = module.platform.cluster_endpoint
}

output "api_container_repository" {
  value = module.platform.api_container_repository
}

output "frontend_container_repository" {
  value = module.platform.frontend_container_repository
}

output "artifacts_bucket" {
  value = module.platform.artifacts_bucket
}
