provider "aws" {
  region = var.region
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
  source       = "../../modules/aws_platform"
  region       = var.region
  cluster_name = var.cluster_name
  tags         = module.global_tags.tags
}
