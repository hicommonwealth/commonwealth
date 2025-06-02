variable "pr_number" {
  description = "PR number for environment naming"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., pr, dev, staging, prod)"
  type        = string
  default     = "pr"
}

variable "k8s_host" {
  description = "Kubernetes API server host URL"
  type        = string
}

variable "k8s_token" {
  description = "Kubernetes API token"
  type        = string
}

variable "k8s_ca" {
  description = "Kubernetes cluster CA certificate (base64)"
  type        = string
}

variable "vault_token" {
  description = "Vault token for External Secrets Operator"
  type        = string
  sensitive   = true
}

variable "image_tag" {
  description = "Docker image tag (usually the commit SHA)"
  type        = string
  default     = "latest"
}

variable "secrets" {
  description = "List of secrets to be managed by External Secrets"
  type = list(object({
    name        = string
    target_name = string
    data        = list(object({
      secretKey = string
      remoteRef = object({
        key      = string
        property = string
      })
    }))
  }))
}

locals {
  name_prefix = "${var.environment}-${var.pr_number}-"
  worker_images = [
    "twitter",
    "message-relayer",
    "knock",
    "graphile-worker",
    "evm-ce",
    "discord-listener",
    "consumer"
  ]
}

provider "kubernetes" {
  host                   = var.k8s_host
  token                  = var.k8s_token
  cluster_ca_certificate = base64decode(var.k8s_ca)
}

provider "helm" {
  kubernetes {
    host                   = var.k8s_host
    token                  = var.k8s_token
    cluster_ca_certificate = base64decode(var.k8s_ca)
  }
}

resource "kubernetes_namespace" "cw" {
  metadata {
    name = "${local.name_prefix}commonwealth"
  }
}

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
    replicas = 1
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
        affinity {
          node_affinity {
            required_during_scheduling_ignored_during_execution {
              node_selector_term {
                match_expressions {
                  key      = "node-type"
                  operator = "In"
                  values   = ["web"]
                }
              }
            }
          }
        }
        container {
          name  = "web"
          image = "ghcr.io/hicommonwealth/web:${var.image_tag}"
          resources {
            requests = {
              cpu    = "800m"
              memory = "1Gi"
            }
            limits = {
              cpu    = "900m"
              memory = "1Gi"
            }
          }
          env {
            name  = "PR_NUMBER"
            value = var.pr_number
          }
          env {
            name  = "ENVIRONMENT"
            value = var.environment
          }
          port {
            container_port = 8080
          }
        }
      }
    }
  }
}

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
        affinity {
          node_affinity {
            required_during_scheduling_ignored_during_execution {
              node_selector_term {
                match_expressions {
                  key      = "node-type"
                  operator = "In"
                  values   = ["worker"]
                }
              }
            }
          }
          pod_anti_affinity {
            preferred_during_scheduling_ignored_during_execution {
              weight = 100
              pod_affinity_term {
                label_selector {
                  match_expressions {
                    key      = "app"
                    operator = "In"
                    values   = [each.key]
                  }
                }
                topology_key = "kubernetes.io/hostname"
              }
            }
          }
        }
        toleration {
          key      = "workload"
          operator = "Equal"
          value    = "worker"
          effect   = "NoSchedule"
        }
        container {
          name  = each.key
          image = "ghcr.io/hicommonwealth/${each.key}:${var.image_tag}"
          env {
            name  = "PR_NUMBER"
            value = var.pr_number
          }
          env {
            name  = "ENVIRONMENT"
            value = var.environment
          }
          resources {
            requests = {
              cpu    = "500m"
              memory = "0.5Gi"
            }
            limits = {
              cpu    = "1000m"
              memory = "0.5Gi"
            }
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

resource "kubernetes_secret" "vault_token" {
  metadata {
    name      = "vault-token"
    namespace = kubernetes_namespace.cw.metadata[0].name
  }
  data = {
    token = var.vault_token
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
          "server" = "<VAULT_ADDR>"
          "path" = "<VAULT_KV_PATH>"
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

resource "helm_release" "reloader" {
  name       = "reloader"
  namespace  = kubernetes_namespace.cw.metadata[0].name
  repository = "https://stakater.github.io/stakater-charts"
  chart      = "reloader"
  version    = "1.4.2"
  create_namespace = false
  depends_on = [kubernetes_namespace.cw]
}

output "web_service_ip" {
  value       = kubernetes_service.web.status[0].load_balancer[0].ingress[0].ip
  description = "The external IP of the web service (load balancer)"
}

output "environment_info" {
  value = {
    pr_number   = var.pr_number
    environment = var.environment
    namespace   = kubernetes_namespace.cw.metadata[0].name
  }
  description = "Information about the deployed environment"
}