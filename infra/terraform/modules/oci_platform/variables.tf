variable "compartment_id" {
  type        = string
  description = "OCI compartment OCID."
}

variable "cluster_name" {
  type        = string
  description = "OKE cluster name."
}

variable "kubernetes_version" {
  type        = string
  description = "OKE Kubernetes version."
  default     = "v1.30.1"
}

variable "node_shape" {
  type        = string
  description = "Compute shape for OKE worker nodes."
  default     = "VM.Standard.E4.Flex"
}

variable "node_ocpus" {
  type        = number
  description = "OCPU count for flex shape."
  default     = 2
}

variable "node_memory_gb" {
  type        = number
  description = "Memory in GiB for flex shape."
  default     = 16
}

variable "tags" {
  type        = map(string)
  description = "Common tags."
  default     = {}
}
