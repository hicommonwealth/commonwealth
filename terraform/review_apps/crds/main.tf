variable "pr_number" {
  description = "PR number for environment naming"
  type        = string
}

variable "k8s_host" {
  description = "Kubernetes API server host URL"
  type        = string
}

variable "k8s_token" {
  description = "Kubernetes API token"
  type        = string
  sensitive   = true
}

variable "k8s_ca" {
  description = "Kubernetes cluster CA certificate (base64)"
  type        = string
  sensitive   = true
}

locals {
  name_prefix = "pr-${var.pr_number}-"
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

# Create namespace first
resource "kubernetes_namespace" "cw" {
  metadata {
    name = "${local.name_prefix}commonwealth"
  }
}

# Install CRDs and operators
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

resource "helm_release" "reloader" {
  name       = "reloader"
  namespace  = kubernetes_namespace.cw.metadata[0].name
  repository = "https://stakater.github.io/stakater-charts"
  chart      = "reloader"
  version    = "1.4.2"
  create_namespace = false
  depends_on = [kubernetes_namespace.cw]
}

# Output namespace for use in apps stage
output "namespace_name" {
  value = kubernetes_namespace.cw.metadata[0].name
  description = "The name of the created namespace"
}