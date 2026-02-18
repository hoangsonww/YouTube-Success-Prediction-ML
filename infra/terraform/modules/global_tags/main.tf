locals {
  default_tags = {
    project     = var.project
    environment = var.environment
    owner       = var.owner
    cost_center = var.cost_center
    managed_by  = "terraform"
    repository  = "YouTube-Success-ML"
  }

  tags = merge(local.default_tags, var.extra_tags)
}
