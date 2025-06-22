terraform {
  backend "s3" {
    bucket = "terraform-common-dev"
    key = "commonwealth-pr-environments/default/terraform.tfstate" # This will be overridden by the workflow
    region = "us-east-1"
  }
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "2.54.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.37.1"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.17.0"
    }
  }
}

# Digital Ocean K8 Setup
provider "digitalocean" {
  token = var.DIGITALOCEAN_TOKEN
}

resource "digitalocean_kubernetes_cluster" "main" {
  name    = var.ENV_NAME
  region  = "nyc1"
  version = "1.32.2-do.3"

  node_pool {
    name       = "worker-pool"
    size       = "s-1vcpu-2gb"
    node_count = 1
    max_nodes = 1
    min_nodes = 1
    auto_scale = false
  }
}

provider "kubernetes" {
  host  = digitalocean_kubernetes_cluster.main.endpoint
  token = digitalocean_kubernetes_cluster.main.kube_config[0].token
  cluster_ca_certificate = base64decode(
    digitalocean_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate
  )
}

# Import helm for ArgoCD bootstrapping
provider "helm" {
  kubernetes {
    host  = digitalocean_kubernetes_cluster.main.endpoint
    token = digitalocean_kubernetes_cluster.main.kube_config[0].token
    cluster_ca_certificate = base64decode(
      digitalocean_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate
    )
  }
}

resource "helm_release" "argocd" {
  depends_on = [digitalocean_kubernetes_cluster.main]
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "8.0.14"

  namespace = "argocd"

  create_namespace = true

  set {
    name  = "server.service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "server.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-type"
    value = "nlb"
  }
}

data "kubernetes_service" "argocd_server" {
  depends_on = [helm_release.argocd]

  metadata {
    name      = "argocd-server"
    namespace = "argocd"
  }
}