terraform {
  backend "s3" {
    bucket = "terraform-common-dev"
    key = "commonwealth-pr-environments/default/terraform.tfstate" # This will be overridden by the workflow
    region = "us-east-1"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.95.0" # Can't be 6.x.x due to eks provider
    }
  }
}

provider "aws" {
  region = var.AWS_REGION
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.21.0" # Can also upgrade when eks upgrade supports v6

  name = "eks-vpc-${var.ENV_NAME}"
  cidr = "10.0.0.0/16"

  # Control plane needs to run on AZ
  azs = ["us-east-1a", "us-east-1b"]
  public_subnets = ["10.0.10.0/24", "10.0.11.0/24"]
  private_subnets = ["10.0.20.0/24", "10.0.21.0/24"]

  enable_nat_gateway = false
  single_nat_gateway = false

  map_public_ip_on_launch = true

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

locals {
  cluster_name = "commonwealth-${var.ENV_NAME}"
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.37.1"

  cluster_name    = local.cluster_name
  cluster_version = "1.33"

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  enable_cluster_creator_admin_permissions = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_group_defaults = {
    attach_cluster_primary_security_group = true
    associate_public_ip_address           = true
  }

  eks_managed_node_groups = {
    arm-nodes = {
      associate_public_ip_address = true
      ami_type      = "BOTTLEROCKET_ARM_64"
      instance_types = ["t4g.large", "t4g.medium"]
      capacity_type = "SPOT"

      subnet_ids = [
        module.vpc.public_subnets[0], # Only in us-east-1a to prevent cross region PV issues on spot bootup
      ]

      desired_size = 2
      min_size     = 1
      max_size     = 2

    }
  }

  tags = {
    Environment = var.ENV_NAME
    Terraform   = "true"
  }
}