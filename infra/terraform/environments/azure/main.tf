module "global_tags" {
  source      = "../../modules/global_tags"
  project     = "youtube-success-ml"
  environment = var.environment
  owner       = var.owner
  cost_center = var.cost_center
  extra_tags  = var.extra_tags
}

module "platform" {
  source              = "../../modules/azure_platform"
  resource_group_name = var.resource_group_name
  location            = var.location
  cluster_name        = var.cluster_name
  tags                = module.global_tags.tags
}
