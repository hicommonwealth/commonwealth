# DigitalOcean Provider
provider "digitalocean" {
  token = var.do_token
}

# Kubernetes Provider (configured after cluster creation)
provider "kubernetes" {
  host                   = digitalocean_kubernetes_cluster.main.endpoint
  token                  = digitalocean_kubernetes_cluster.main.kube_config[0].token
  cluster_ca_certificate = base64decode(digitalocean_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
}

# Variables
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"
}

variable "image_tag" {
  description = "Docker image tag (usually the commit SHA)"
  type        = string
  default     = "latest"
}

# Create Kubernetes Cluster
resource "digitalocean_kubernetes_cluster" "main" {
  name    = "cw-ci-cluster"
  region  = var.region
  version = "1.29.1-do.0" # You may want to update this to the latest supported version

  node_pool {
    name       = "default-pool"
    size       = "s-2vcpu-4gb"
    node_count = 3
  }
}

# Kubernetes Namespace
resource "kubernetes_namespace" "cw" {
  metadata {
    name = "commonwealth"
  }
}

# Web Deployment and Service (exposed via Load Balancer)
resource "kubernetes_deployment" "web" {
  metadata {
    name      = "web"
    namespace = kubernetes_namespace.cw.metadata[0].name
    labels = {
      app = "web"
    }
  }
  spec {
    replicas = 2
    selector {
      match_labels = {
        app = "web"
      }
    }
    template {
      metadata {
        labels = {
          app = "web"
        }
      }
      spec {
        container {
          name  = "web"
          image = "ghcr.io/hicommonwealth/web:${var.image_tag}"
          ports {
            container_port = 8080
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "web" {
  metadata {
    name      = "web"
    namespace = kubernetes_namespace.cw.metadata[0].name
    labels = {
      app = "web"
    }
  }
  spec {
    selector = {
      app = "web"
    }
    port {
      port        = 80
      target_port = 8080
    }
    type = "LoadBalancer"
  }
}

# Background Worker Deployments (no service needed)
locals {
  worker_images = [
    "twitter",
    "message_relayer",
    "knock",
    "graphile_worker",
    "evm_ce",
    "discord_listener",
    "consumer"
  ]
}

resource "kubernetes_deployment" "worker" {
  for_each = toset(local.worker_images)
  metadata {
    name      = each.key
    namespace = kubernetes_namespace.cw.metadata[0].name
    labels = {
      app = each.key
    }
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = each.key
      }
    }
    template {
      metadata {
        labels = {
          app = each.key
        }
      }
      spec {
        container {
          name  = each.key
          image = "ghcr.io/hicommonwealth/${each.key}:${var.image_tag}"
        }
      }
    }
  }
}

# Output cluster and load balancer info
output "kubeconfig" {
  value     = digitalocean_kubernetes_cluster.main.kube_config[0].raw_config
  sensitive = true
}

output "web_service_ip" {
  value = kubernetes_service.web.status[0].load_balancer[0].ingress[0].ip
  description = "The external IP of the web service (load balancer)"
} 