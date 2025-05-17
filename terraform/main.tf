# Create Kubernetes Cluster with two node pools
resource "digitalocean_kubernetes_cluster" "main" {
  name    = "cw-ci-cluster"
  region  = var.region
  version = "1.29.1-do.0"

  # Web node pool - smaller since we only need 1 pod
  node_pool {
    name       = "web-pool"
    size       = "s-1vcpu-3gb"  # 1 vCPU, 3GB memory (smallest DO size that meets requirements)
    node_count = 1              # For 1 web replica
    labels = {
      "node-type" = "web"
    }
  }

  # Worker node pool - sized for worker requirements
  node_pool {
    name       = "worker-pool"
    size       = "s-4vcpu-8gb"  # 4 vCPUs, 8GB memory (good fit for 3-4 worker pods)
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
                  values   = ["web"]
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
              cpu    = "800m"   # 0.8 vCPU (leaving some buffer for system processes)
              memory = "2.5Gi"  # 2.5GB as specified
            }
            limits = {
              cpu    = "900m"   # 0.9 vCPU max
              memory = "2.5Gi"  # 2.5GB as specified
            }
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
        # Node affinity to ensure worker pods only run on worker nodes
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
          # Pod anti-affinity to spread workers across nodes evenly
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

          # Resource requests/limits per your specifications
          resources {
            requests = {
              cpu    = "500m"   # 0.5 vCPU as specified
              memory = "2.5Gi"  # 2.5GB as specified
            }
            limits = {
              cpu    = "1000m"  # 1 vCPU max (to prevent a single worker from consuming too much)
              memory = "2.5Gi"  # 2.5GB as specified
            }
          }
        }
      }
    }
  }
}