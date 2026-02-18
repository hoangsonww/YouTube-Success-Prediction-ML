provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
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
  source         = "../../modules/oci_platform"
  compartment_id = var.compartment_id
  cluster_name   = var.cluster_name
  tags           = module.global_tags.tags
}
