terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "replace-with-tf-state-bucket"
    key            = "youtube-success-ml/aws/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "replace-with-lock-table"
    encrypt        = true
  }
}
