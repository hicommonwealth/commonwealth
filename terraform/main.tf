# Terraform Backend Configuration
terraform {
  # Note: The key will be set dynamically in the GitHub Actions workflow
  # with: terraform init -backend-config="key=commonwealth-pr-environments/pr-${PR_NUMBER}/terraform.tfstate"
  backend "s3" {
    bucket = "terraform-common-dev"
    key = "commonwealth-pr-environments/default/terraform.tfstate" # This will be overridden
    region = "us-east-1"
    # TODO: add state locking via DynamoDB?
  }
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "2.54.0"
    }
  }
}

# DigitalOcean Provider
provider "digitalocean" {
  token = var.do_token
}

# Kubernetes Provider (configured after cluster creation)
provider "kubernetes" {
  host  = digitalocean_kubernetes_cluster.main.endpoint
  token = digitalocean_kubernetes_cluster.main.kube_config[0].token
  cluster_ca_certificate = base64decode(digitalocean_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
}

# External Secrets Operator (ESO) via Helm
provider "helm" {
  kubernetes {
    host                   = digitalocean_kubernetes_cluster.main.endpoint
    token                  = digitalocean_kubernetes_cluster.main.kube_config[0].token
    cluster_ca_certificate = base64decode(digitalocean_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate)
  }
}

# Variables
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

variable "image_tag" {
  description = "Docker image tag (usually the commit SHA)"
  type        = string
  default     = "latest"
}

# PR-specific variables
variable "pr_number" {
  description = "PR number for environment naming"
  type        = string
  default     = "dev"  # Default for local development
}

variable "environment" {
  description = "Environment name (e.g., pr, dev, staging, prod)"
  type        = string
  default     = "pr"
}

variable "vault_token" {
  description = "Vault token for External Secrets Operator"
  type        = string
  sensitive   = true
}

# Local values for naming resources
locals {
  name_prefix = "${var.environment}-${var.pr_number}-"
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

# Create Kubernetes Namespace
resource "kubernetes_namespace" "cw" {
  metadata {
    name = "${local.name_prefix}commonwealth"
  }
}

# Create Kubernetes Cluster with two node pools
resource "digitalocean_kubernetes_cluster" "main" {
  name    = "${local.name_prefix}cluster"
  region  = var.region
  version = "1.32.2-do.1"

  # Web node pool - smaller since we only need 1 pod
  node_pool {
    name = "${local.name_prefix}web-pool"
    size = "s-1vcpu-3gb"  # 1 vCPU, 3GB memory (smallest DO size that meets requirements)
    node_count = 1              # For 1 web replica
    labels = {
      "node-type" = "web"
    }
  }

  # Worker node pool - sized for worker requirements
  node_pool {
    name = "${local.name_prefix}worker-pool"
    size = "s-4vcpu-8gb"  # 4 vCPUs, 8GB memory (good fit for 3-4 worker pods)
    node_count = 3              # 3 nodes can fit all 7 workers (with ~2 workers per node)
    labels = {
      "node-type" = "worker"
    }
    taint {
      key    = "workload"
      value  = "worker"
      effect = "NoSchedule"
    }
  }
}

# Web Deployment with 1 replica
resource "kubernetes_deployment" "web" {
  metadata {
    name      = "web"
    namespace = kubernetes_namespace.cw.metadata[0].name
    labels = {
      app = "web"
      pr  = var.pr_number
    }
  }
  spec {
    replicas = 1  # Reduced to 1 replica
    selector {
      match_labels = {
        app = "web"
      }
    }
    template {
      metadata {
        labels = {
          app = "web"
          pr  = var.pr_number
        }
      }
      spec {
        # Node affinity to ensure web pods only run on web nodes
        affinity {
          node_affinity {
            required_during_scheduling_ignored_during_execution {
              node_selector_term {
                match_expressions {
                  key      = "node-type"
                  operator = "In"
                  values = ["web"]
                }
              }
            }
          }
        }

        container {
          name  = "web"
          image = "ghcr.io/hicommonwealth/web:${var.image_tag}"

          # Resource requests and limits
          resources {
            requests = {
              cpu = "800m"   # 0.8 vCPU (leaving some buffer for system processes)
              memory = "2.5Gi"  # 2.5GB as specified
            }
            limits = {
              cpu = "900m"   # 0.9 vCPU max
              memory = "2.5Gi"  # 2.5GB as specified
            }
          }

          # Add environment variables to identify the environment
          env {
            name  = "PR_NUMBER"
            value = var.pr_number
          }

          env {
            name  = "ENVIRONMENT"
            value = var.environment
          }

          ports {
            container_port = 8080
          }
        }
      }
    }
  }
}

# Worker Deployments with higher resource allocation
resource "kubernetes_deployment" "worker" {
  for_each = toset(local.worker_images)
  metadata {
    name      = each.key
    namespace = kubernetes_namespace.cw.metadata[0].name
    labels = {
      app = each.key
      pr  = var.pr_number
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
          pr  = var.pr_number
        }
      }
      spec {
        # Node affinity to ensure worker pods only run on worker nodes
        affinity {
          node_affinity {
            required_during_scheduling_ignored_during_execution {
              node_selector_term {
                match_expressions {
                  key      = "node-type"
                  operator = "In"
                  values = ["worker"]
                }
              }
            }
          }
          # Pod anti-affinity to spread workers across nodes evenly
          pod_anti_affinity {
            preferred_during_scheduling_ignored_during_execution {
              weight = 100
              pod_affinity_term {
                label_selector {
                  match_expressions {
                    key      = "app"
                    operator = "In"
                    values = [each.key]
                  }
                }
                topology_key = "kubernetes.io/hostname"
              }
            }
          }
        }

        # Toleration to allow scheduling on tainted worker nodes
        toleration {
          key      = "workload"
          operator = "Equal"
          value    = "worker"
          effect   = "NoSchedule"
        }

        container {
          name  = each.key
          image = "ghcr.io/hicommonwealth/${each.key}:${var.image_tag}"

          # Add environment variables to identify the environment
          env {
            name  = "PR_NUMBER"
            value = var.pr_number
          }

          env {
            name  = "ENVIRONMENT"
            value = var.environment
          }

          # Resource requests/limits per your specifications
          resources {
            requests = {
              cpu = "500m"   # 0.5 vCPU as specified
              memory = "2.5Gi"  # 2.5GB as specified
            }
            limits = {
              cpu = "1000m"  # 1 vCPU max (to prevent a single worker from consuming too much)
              memory = "2.5Gi"  # 2.5GB as specified
            }
          }
        }
      }
    }
  }
}

# Web Service configuration
resource "kubernetes_service" "web" {
  metadata {
    name      = "web"
    namespace = kubernetes_namespace.cw.metadata[0].name
    labels = {
      app = "web"
      pr  = var.pr_number
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

# External Secrets Operator (ESO) via Helm
resource "helm_release" "external_secrets" {
  name       = "external-secrets"
  namespace  = kubernetes_namespace.cw.metadata[0].name
  repository = "https://charts.external-secrets.io"
  chart      = "external-secrets"
  version    = "0.16.0"
  create_namespace = false
  values = [
    <<-EOF
    installCRDs: true
    EOF
  ]
}

# --- Vault SecretStore ---
resource "kubernetes_secret" "vault_token" {
  metadata {
    name      = "vault-token"
    namespace = kubernetes_namespace.cw.metadata[0].name
  }
  data = {
    token = var.vault_token # Value is passed from workflow as a Terraform variable
  }
}

resource "kubernetes_manifest" "vault_secretstore" {
  manifest = {
    "apiVersion" = "external-secrets.io/v1beta1"
    "kind" = "SecretStore"
    "metadata" = {
      "name" = "vault-backend"
      "namespace" = kubernetes_namespace.cw.metadata[0].name
    }
    "spec" = {
      "provider" = {
        "vault" = {
          "server" = "<VAULT_ADDR>" # <-- Set your Vault address here
          "path" = "<VAULT_KV_PATH>" # <-- Set your Vault KV path here (e.g., secret/)
          "version" = "v2"
          "auth" = {
            "tokenSecretRef" = {
              "name" = kubernetes_secret.vault_token.metadata[0].name
              "key" = "token"
            }
          }
        }
      }
    }
  }
  depends_on = [helm_release.external_secrets]
}

# --- External Secrets (secrets list managed in secrets.auto.tfvars) ---
resource "kubernetes_manifest" "external_secret" {
  for_each = { for s in var.secrets : s.name => s }
  manifest = {
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "ExternalSecret"
    metadata = {
      name      = each.value.name
      namespace = kubernetes_namespace.cw.metadata[0].name
    }
    spec = {
      refreshInterval = "10m"
      secretStoreRef = {
        name = kubernetes_manifest.vault_secretstore.manifest["metadata"]["name"]
        kind = "SecretStore"
      }
      target = {
        name = each.value.target_name
      }
      data = each.value.data
    }
  }
}

# --- Stakater Reloader (auto-restart pods on secret/configmap change) ---
resource "helm_release" "reloader" {
  name       = "reloader"
  namespace  = kubernetes_namespace.cw.metadata[0].name
  repository = "https://stakater.github.io/stakater-charts"
  chart      = "reloader"
  version    = "1.4.2"
  create_namespace = false
  depends_on = [kubernetes_namespace.cw]
}

# Output cluster and load balancer info
output "kubeconfig" {
  value       = digitalocean_kubernetes_cluster.main.kube_config[0].raw_config
  sensitive   = true
  description = "Kubernetes configuration for connecting to the cluster"
}

output "web_service_ip" {
  value       = kubernetes_service.web.status[0].load_balancer[0].ingress[0].ip
  description = "The external IP of the web service (load balancer)"
}

output "cluster_name" {
  value       = digitalocean_kubernetes_cluster.main.name
  description = "The name of the Kubernetes cluster"
}

output "environment_info" {
  value = {
    pr_number   = var.pr_number
    environment = var.environment
    namespace   = kubernetes_namespace.cw.metadata[0].name
  }
  description = "Information about the deployed environment"
}