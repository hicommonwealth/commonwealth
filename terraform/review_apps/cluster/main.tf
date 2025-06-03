terraform {
  backend "s3" {
    bucket = "terraform-common-dev"
    key    = "commonwealth-pr-environments/default/terraform.tfstate" # This will be overridden by the workflow
    region = "us-east-1"
  }
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "2.54.0"
    }
  }
}

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
}

variable "environment" {
  description = "Environment name (e.g., pr, dev, staging, prod)"
  type        = string
  default     = "pr"
}

provider "digitalocean" {
  token = var.do_token
}

locals {
  name_prefix = "${var.environment}-${var.pr_number}-"
}

resource "digitalocean_kubernetes_cluster" "main" {
  name    = "${local.name_prefix}cluster"
  region  = var.region
  version = "1.32.2-do.2"

  node_pool {
    name       = "${local.name_prefix}web-pool"
    size       = "s-1vcpu-2gb"
    node_count = 1
    labels = {
      "node-type" = "web"
    }
    max_nodes = 1
    min_nodes = 1 // TODO: figure out if we can do min 0 and scale on first request
    auto_scale = false
  }
}

resource "digitalocean_kubernetes_node_pool" "worker" {
  cluster_id = digitalocean_kubernetes_cluster.main.id
  name       = "${local.name_prefix}worker-pool"
  size       = "s-4vcpu-8gb"
  node_count = 2
  labels = {
    "node-type" = "worker"
  }
  taint {
    key    = "workload"
    value  = "worker"
    effect = "NoSchedule"
  }
}

output "kubeconfig" {
  value       = digitalocean_kubernetes_cluster.main.kube_config[0].raw_config
  sensitive   = true
  description = "Kubernetes configuration for connecting to the cluster"
}

output "cluster_name" {
  value       = digitalocean_kubernetes_cluster.main.name
  description = "The name of the Kubernetes cluster"
}