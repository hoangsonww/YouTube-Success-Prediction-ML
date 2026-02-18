terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.110"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "azurerm" {
    resource_group_name  = "replace-rg"
    storage_account_name = "replacestateacct"
    container_name       = "tfstate"
    key                  = "youtube-success-ml/azure/terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}
