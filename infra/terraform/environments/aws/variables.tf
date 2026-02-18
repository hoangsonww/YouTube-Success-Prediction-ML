variable "region" {
  type        = string
  description = "AWS region for platform resources."
}

variable "environment" {
  type        = string
  description = "Environment name."
  default     = "prod"
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name."
  default     = "yts-eks-prod"
}

variable "owner" {
  type        = string
  description = "Owning team."
  default     = "ml-platform"
}

variable "cost_center" {
  type        = string
  description = "Cost center code."
  default     = "ml-001"
}

variable "extra_tags" {
  type        = map(string)
  default     = {}
}
