variable "project_id" {
  type        = string
  description = "GCP project ID."
}

variable "region" {
  type        = string
  description = "GCP region."
}

variable "zone" {
  type        = string
  description = "GCP zone."
}

variable "environment" {
  type        = string
  default     = "prod"
}

variable "cluster_name" {
  type        = string
  default     = "yts-gke-prod"
}

variable "owner" {
  type        = string
  default     = "ml-platform"
}

variable "cost_center" {
  type        = string
  default     = "ml-001"
}

variable "extra_tags" {
  type        = map(string)
  default     = {}
}
