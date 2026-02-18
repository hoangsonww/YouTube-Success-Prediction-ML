variable "region" {
  type        = string
  description = "AWS region."
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name."
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for VPC."
  default     = "10.10.0.0/16"
}

variable "subnet_cidrs" {
  type        = list(string)
  description = "Public subnets for EKS worker nodes."
  default     = ["10.10.1.0/24", "10.10.2.0/24", "10.10.3.0/24"]
}

variable "node_instance_type" {
  type        = string
  description = "EKS node group instance type."
  default     = "t3.large"
}

variable "node_desired_size" {
  type        = number
  description = "Desired nodes in node group."
  default     = 3
}

variable "node_min_size" {
  type        = number
  description = "Minimum nodes in node group."
  default     = 2
}

variable "node_max_size" {
  type        = number
  description = "Maximum nodes in node group."
  default     = 8
}

variable "tags" {
  type        = map(string)
  description = "Resource tags."
  default     = {}
}
