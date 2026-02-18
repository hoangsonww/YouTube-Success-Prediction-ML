variable "tenancy_ocid" {
  type = string
}

variable "user_ocid" {
  type = string
}

variable "fingerprint" {
  type = string
}

variable "private_key_path" {
  type = string
}

variable "region" {
  type = string
}

variable "compartment_id" {
  type = string
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "cluster_name" {
  type    = string
  default = "yts-oke-prod"
}

variable "owner" {
  type    = string
  default = "ml-platform"
}

variable "cost_center" {
  type    = string
  default = "ml-001"
}

variable "extra_tags" {
  type    = map(string)
  default = {}
}
