output "cluster_name" {
  value       = azurerm_kubernetes_cluster.this.name
  description = "AKS cluster name."
}

output "cluster_fqdn" {
  value       = azurerm_kubernetes_cluster.this.fqdn
  description = "AKS API endpoint FQDN."
}

output "acr_login_server" {
  value       = azurerm_container_registry.this.login_server
  description = "ACR login server for image pushes."
}

output "artifacts_storage_account" {
  value       = azurerm_storage_account.artifacts.name
  description = "Storage account used for artifacts."
}

output "artifacts_container" {
  value       = azurerm_storage_container.artifacts.name
  description = "Blob container used for artifacts."
}
