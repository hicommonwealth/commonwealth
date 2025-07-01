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

data "aws_availability_zones" "available" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.21.0" # Can also upgrade when eks upgrade supports v6

  name = "eks-vpc-${var.ENV_NAME}"
  cidr = "10.0.0.0/16"

  # Required to have at least 2 AZs for subnets
  azs             = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnets  = ["10.0.10.0/24", "10.0.11.0/24"]
  private_subnets = ["10.0.20.0/24", "10.0.21.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.37.1"

  cluster_name    = "commonwealth-${var.ENV_NAME}"
  cluster_version = "1.33"

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  enable_cluster_creator_admin_permissions = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    arm-nodes = {
      ami_type       = "BOTTLEROCKET_ARM_64"
      instance_types = ["t4g.nano"]
      capacity_type  = "ON_DEMAND"

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