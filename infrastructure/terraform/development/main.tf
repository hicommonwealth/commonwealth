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
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.6.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.37.1"
    }
  }
}

# Digital Ocean K8 Setup
provider "digitalocean" {
  token = var.DIGITALOCEAN_TOKEN
}

# Cloudflare to set up tunnel
provider "cloudflare" {
  api_token = var.CLOUDFLARE_API_TOKEN
}

resource "digitalocean_kubernetes_cluster" "main" {
  name    = var.ENV_NAME
  region  = "nyc1"
  version = "1.33.1-do.0"

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

# Create cloudflare tunnel
resource "cloudflare_zero_trust_tunnel_cloudflared" "cmn_tunnel" {
  account_id = var.CLOUDFLARE_ACCOUNT_ID
  name = "commonwealth-${var.ENV_NAME}"
}

data "cloudflare_zero_trust_tunnel_cloudflared_token" "tunnel_token" {
  account_id   = var.CLOUDFLARE_ACCOUNT_ID
  tunnel_id   = cloudflare_zero_trust_tunnel_cloudflared.cmn_tunnel.id
}

resource "kubernetes_secret" "tunnel_token_secret" {
  metadata {
    name      = "tunnel-token"
    namespace = "cloudflare"
  }

  data = {
    token = data.cloudflare_zero_trust_tunnel_cloudflared_token.tunnel_token.token
  }

  type = "Opaque"
}
