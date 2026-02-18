variable "resource_group_name" {
  type        = string
  description = "Resource group name."
}

variable "location" {
  type        = string
  description = "Azure region."
}

variable "cluster_name" {
  type        = string
  description = "AKS cluster name."
}

variable "kubernetes_version" {
  type        = string
  description = "AKS kubernetes version."
  default     = "1.30"
}

variable "node_count" {
  type        = number
  description = "AKS default node count."
  default     = 3
}

variable "node_vm_size" {
  type        = string
  description = "AKS node VM size."
  default     = "Standard_D4s_v5"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags."
  default     = {}
}
