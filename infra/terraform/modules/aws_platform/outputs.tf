output "cluster_name" {
  value       = aws_eks_cluster.this.name
  description = "EKS cluster name."
}

output "cluster_endpoint" {
  value       = aws_eks_cluster.this.endpoint
  description = "EKS API endpoint."
}

output "cluster_ca" {
  value       = aws_eks_cluster.this.certificate_authority[0].data
  description = "EKS cluster certificate authority data."
}

output "api_repository_url" {
  value       = aws_ecr_repository.api.repository_url
  description = "ECR URL for API container image."
}

output "frontend_repository_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "ECR URL for frontend container image."
}

output "artifacts_bucket" {
  value       = aws_s3_bucket.artifacts.bucket
  description = "S3 bucket for model and pipeline artifacts."
}
