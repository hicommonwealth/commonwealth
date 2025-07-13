terraform {
  backend "s3" {
    bucket = "terraform-common-dev"
    key = "commonwealth-pr-environments/default/terraform.tfstate" # This will be overridden by the workflow
    region = var.AWS_REGION
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
  source = "terraform-aws-modules/vpc/aws"
  version = "5.21.0" # Can also upgrade when eks upgrade supports v6

  name = "eks-vpc-${var.ENV_NAME}"
  cidr = "10.0.0.0/16"

  # Required to have at least 2 AZs for subnets
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnets = ["10.0.10.0/24", "10.0.11.0/24"]
  private_subnets = ["10.0.20.0/24", "10.0.21.0/24"]

  # Disable managed nats since we are using fck-nat
  enable_nat_gateway = false
  single_nat_gateway = false

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

# TODO: In production for multi-AZ we need 1 fck-nat per each AZ. This means we should for-each over it to create
# them on each public subnet, and route corresponding private-subnet traffic through it.
module "fck-nat" {
  source = "RaJiska/fck-nat/aws"

  name      = "fck-nat-${var.ENV_NAME}"
  vpc_id    = module.vpc.vpc_id
  subnet_id = module.vpc.public_subnets[0]

  ha_mode             = true
  update_route_tables = true
  route_tables_ids    = {
    for idx, subnet in module.vpc.private_subnets :
    "private-rt-${idx}" => module.vpc.private_route_table_ids[idx]
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

  cluster_addons = {
    # Enables ip prefix delegation which increases the maximum pod limit per node
    vpc-cni = {
      most_recent    = true
      before_compute = true
      configuration_values = jsonencode({
        env = {
          ENABLE_PREFIX_DELEGATION = "true"
          WARM_PREFIX_TARGET       = "1"
        }
      })
    }
    aws-ebs-csi-driver = {
      service_account_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.cluster_name}-ebs-csi-controller"
    }
  }

  eks_managed_node_groups = {
    arm-nodes = {
      ami_type      = "BOTTLEROCKET_ARM_64"
      instance_types = ["t4g.large", "t4g.medium"]
      capacity_type = "SPOT"

      desired_size = 1
      min_size     = 1
      max_size     = 2
    }
  }

  tags = {
    Environment = var.ENV_NAME
    Terraform   = "true"
  }
}

locals {
  ebs_csi_service_account_namespace = "kube-system"
  ebs_csi_service_account_name      = "ebs-csi-controller-sa"
}

resource "aws_iam_policy" "ebs_csi_controller" {
  name_prefix = "ebs-csi-controller"
  description = "EKS ebs-csi-controller policy for cluster ${local.cluster_name}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:AttachVolume",
          "ec2:DetachVolume",
          "ec2:ModifyVolume",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInstances",
          "ec2:DescribeSnapshots",
          "ec2:DescribeTags",
          "ec2:DescribeVolumes",
          "ec2:CreateTags",
          "ec2:DeleteTags",
          "ec2:CreateVolume",
          "ec2:DeleteVolume"
        ]
        Resource = "*"
      }
    ]
  })
}

module "ebs_csi_controller_role" {
  source      = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version     = "5.11.1"
  create_role = true
  role_name   = "${local.cluster_name}-ebs-csi-controller"
  provider_url = replace(module.eks.cluster_oidc_issuer_url, "https://", "")
  role_policy_arns = [aws_iam_policy.ebs_csi_controller.arn]
  oidc_fully_qualified_subjects = [
    "system:serviceaccount:${local.ebs_csi_service_account_namespace}:${local.ebs_csi_service_account_name}"
  ]
}

## KMS for vault
locals {
  oidc_provider_sub = "${module.eks.oidc_provider}:sub"
}

resource "aws_iam_role" "irsa_role_iam" {
  name = "vault-server-role-${var.ENV_NAME}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals : {
            (local.oidc_provider_sub) = "system:serviceaccount:default:vault"
          },
        }
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

module "vault_kms" {
  source  = "terraform-aws-modules/kms/aws"
  version = "3.1.1"

  description = "KMS key for Vault auto-unseal"
  deletion_window_in_days = 7

  key_users = [
    "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/vault-server-role-${var.ENV_NAME}"
  ]

  key_administrators = [
    "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/kurtis"
  ]

  aliases = ["vault-unseal-${var.ENV_NAME}"]

  tags = {
    Name        = "vault-kms"
    Environment = var.ENV_NAME
  }
}

# Write output here, will need to feed them into vault charts
resource "local_file" "vault_outputs" {
  filename = "${path.module}/.env"
  content  = <<EOF
irsaRoleArn=${aws_iam_role.irsa_role_iam.arn}
kmsKeyArn=${module.vault_kms.key_arn}
awsRegion=${var.AWS_REGION}
EOF
}