variable "project" {
  type        = string
  description = "Project name tag."
}

variable "environment" {
  type        = string
  description = "Environment tag (dev/staging/prod)."
}

variable "owner" {
  type        = string
  description = "Owner/team for this stack."
}

variable "cost_center" {
  type        = string
  description = "Cloud billing cost center."
}

variable "extra_tags" {
  type        = map(string)
  description = "Additional tags to merge with defaults."
  default     = {}
}
