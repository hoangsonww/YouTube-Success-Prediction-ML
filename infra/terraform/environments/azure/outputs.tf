output "cluster_name" {
  value = module.platform.cluster_name
}

output "cluster_fqdn" {
  value = module.platform.cluster_fqdn
}

output "acr_login_server" {
  value = module.platform.acr_login_server
}

output "artifacts_storage_account" {
  value = module.platform.artifacts_storage_account
}

output "artifacts_container" {
  value = module.platform.artifacts_container
}
