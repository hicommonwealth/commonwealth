variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"
}

variable "pr_number" {
  description = "PR number for environment naming"
  type        = string
  default     = "dev"
}

variable "environment" {
  description = "Environment name (e.g., pr, dev, staging, prod)"
  type        = string
  default     = "pr"
}