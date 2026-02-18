output "cluster_name" {
  value = module.platform.cluster_name
}

output "cluster_endpoint" {
  value = module.platform.cluster_endpoint
}

output "api_repository_url" {
  value = module.platform.api_repository_url
}

output "frontend_repository_url" {
  value = module.platform.frontend_repository_url
}

output "artifacts_bucket" {
  value = module.platform.artifacts_bucket
}
