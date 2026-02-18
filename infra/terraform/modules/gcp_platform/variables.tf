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
  description = "Primary GCP zone."
}

variable "cluster_name" {
  type        = string
  description = "GKE cluster name."
}

variable "network_cidr" {
  type        = string
  description = "CIDR for VPC network (informational tag only)."
  default     = "10.20.0.0/16"
}

variable "subnetwork_cidr" {
  type        = string
  description = "Subnetwork range for cluster nodes."
  default     = "10.20.0.0/20"
}

variable "node_machine_type" {
  type        = string
  description = "Machine type for GKE node pool."
  default     = "e2-standard-4"
}

variable "tags" {
  type        = map(string)
  description = "Additional labels for resources."
  default     = {}
}
