# Main Terraform configuration for infrastructure provisioning

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr = var.vpc_cidr
  public_subnets = var.public_subnets
  private_subnets = var.private_subnets
}

# EKS Module
module "eks" {
  source = "./modules/eks"

  cluster_name = var.cluster_name
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  node_groups = {
    general = {
      desired_capacity = 2
      max_capacity     = 5
      min_capacity     = 1

      instance_type = "t3.medium"
    }
  }
}

# ECR Repository for Docker images
resource "aws_ecr_repository" "social_network" {
  name = "social-network-repo"

  image_scanning_configuration {
    scan_on_push = true
  }
}