variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  default     = "buildworks-ai"
}

variable "db_name" {
  description = "Database name"
  default     = "buildworks_db"
}

variable "db_username" {
  description = "Database username"
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  sensitive   = true
}

variable "ecr_repository_url" {
  description = "ECR Repository URL"
}
