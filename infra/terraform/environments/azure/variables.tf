variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "cluster_name" {
  type    = string
  default = "yts-aks-prod"
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
