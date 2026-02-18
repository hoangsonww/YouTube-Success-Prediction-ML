provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

module "global_tags" {
  source      = "../../modules/global_tags"
  project     = "youtube-success-ml"
  environment = var.environment
  owner       = var.owner
  cost_center = var.cost_center
  extra_tags  = var.extra_tags
}

module "platform" {
  source       = "../../modules/gcp_platform"
  project_id   = var.project_id
  region       = var.region
  zone         = var.zone
  cluster_name = var.cluster_name
  tags         = module.global_tags.tags
}
