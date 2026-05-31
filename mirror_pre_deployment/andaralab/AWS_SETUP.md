# AWS Integration Setup Guide
# Complete AWS Infrastructure for AndaraLab with 100-Year Data Retention

## Overview

This guide covers setting up AWS infrastructure for AndaraLab with:
- AWS RDS PostgreSQL for database hosting
- S3 + Glacier for 100-year data retention
- CloudTrail for comprehensive activity logging
- Automated backups via AWS Lambda
- Manual backup scripts for on-demand backups
- Cross-region replication for disaster recovery
- Data integrity checks and validation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Infrastructure                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────────────────────────┐  │
│  │   RDS        │    │   S3 Buckets (100-year retention) │  │
│  │ PostgreSQL   │────┤   - Database Backups            │  │
│  │ (Multi-AZ)   │    │   - Application Data            │  │
│  └──────────────┘    │   - CloudTrail Logs             │  │
│                      └──────────────────────────────────┘  │
│                          ↓ 30 days → Glacier                │
│                          ↓ 90 days → Glacier IR             │
│                          ↓ 1 year → Deep Archive            │
│                          ↓ 100 years → Expire                 │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   CloudTrail (Activity Logging - 100 years)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Lambda Function (Daily Automated Backup)         │   │
│  │   - Creates RDS snapshots                            │   │
│  │   - Exports metadata to S3                           │   │
│  │   - Cleans up old snapshots (30 days)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- AWS Account with appropriate permissions
- Terraform installed (v1.0+)
- AWS CLI installed and configured
- PostgreSQL client tools (for manual backups)
- Basic knowledge of AWS services

## Step 1: Configure AWS CLI

```bash
# Install AWS CLI (if not already installed)
# macOS
brew install awscli

# Linux
sudo apt-get install awscli

# Windows
# Download from https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
```

You'll be prompted for:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name (recommended: `ap-southeast-1`)
- Default output format (recommended: `json`)

## Step 2: Set Up Terraform Infrastructure

### 2.1 Navigate to Terraform Directory

```bash
cd infrastructure/terraform
```

### 2.2 Configure Variables

Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
aws_region      = "ap-southeast-1"
aws_account_id  = "YOUR_AWS_ACCOUNT_ID"
project_name    = "andaralab"
environment     = "production"

vpc_cidr               = "10.0.0.0/16"
allowed_cidr_blocks    = ["10.0.0.0/16", "YOUR_VPN_CIDR_HERE"]

db_engine_version      = "15.4"
db_instance_class      = "db.t3.micro"
db_storage             = 20
db_max_storage         = 100
db_name                = "andaralab"
db_username            = "andaralab_admin"
db_password            = "CHANGE_THIS_STRONG_PASSWORD_123!"
db_multi_az            = true
db_backup_retention_days = 35
```

**Important Security Notes:**
- Use a strong password for `db_password` (minimum 8 characters, include uppercase, lowercase, numbers, special characters)
- Update `allowed_cidr_blocks` to include your VPN/office IP ranges
- Never commit `terraform.tfvars` to version control

### 2.3 Initialize Terraform

```bash
terraform init
```

### 2.4 Review and Apply Infrastructure

```bash
# Review the plan
terraform plan

# Apply the infrastructure (type 'yes' when prompted)
terraform apply
```

This will create:
- VPC with public and private subnets
- RDS PostgreSQL instance with Multi-AZ
- S3 buckets with 100-year lifecycle policies
- CloudTrail for activity logging
- IAM roles and policies
- Lambda function for automated backups
- CloudWatch Event Rule for daily backup trigger

### 2.5 Save Outputs

After successful deployment, save the Terraform outputs:

```bash
terraform output -json > ../terraform-outputs.json
```

Key outputs to note:
- `database_endpoint` - RDS endpoint for connection
- `database_port` - Database port (default: 5432)
- `database_name` - Database name
- `s3_database_backups` - S3 bucket for database backups
- `s3_app_data` - S3 bucket for application data

## Step 3: Configure Application Environment Variables

Update your application's `.env` file with AWS RDS connection details:

```bash
# Database Configuration (AWS RDS)
DATABASE_URL="postgresql://andaralab_admin:YOUR_PASSWORD@andaralab-db.xxxx.ap-southeast-1.rds.amazonaws.com:5432/andaralab?sslmode=require"

# Alternative: Individual variables
DB_HOST="andaralab-db.xxxx.ap-southeast-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="andaralab"
DB_USER="andaralab_admin"
DB_PASSWORD="YOUR_PASSWORD"

# AWS Configuration
AWS_REGION="ap-southeast-1"
AWS_RDS_ENDPOINT="andaralab-db.xxxx.ap-southeast-1.rds.amazonaws.com"
AWS_RDS_REGION="ap-southeast-1"
AWS_RDS_INSTANCE_ID="andaralab-db"
AWS_RDS_MULTI_AZ="true"
AWS_RDS_BACKUP_RETENTION="35"

# S3 Configuration (for application data)
AWS_S3_BUCKET="andaralab-app-data-production"
AWS_S3_PREFIX="andaralab-data"
AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"
AWS_S3_SYNC_ENABLED="true"

# Environment
NODE_ENV="production"
ENVIRONMENT="production"
```

## Step 4: Deploy Lambda Function for Automated Backups

### 4.1 Package Lambda Function

```bash
cd infrastructure/terraform/lambda

# Install dependencies (if any)
pip install boto3 -t .

# Create deployment package
zip -r backup.zip backup.py

cd ../..
```

### 4.2 Update Lambda Code in Terraform

The Lambda function is already configured in `main.tf`. If you need to update the code:

```bash
# Re-deploy Lambda
terraform apply -target=aws_lambda_function.database_backup
```

The Lambda function will:
- Run daily at 3:00 AM (configurable in `main.tf`)
- Create RDS snapshots
- Export metadata to S3
- Clean up snapshots older than 30 days
- Log all activities to CloudWatch

## Step 5: Test Manual Backup Script

### 5.1 Install PostgreSQL Client Tools

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# CentOS/RHEL
sudo yum install postgresql
```

### 5.2 Configure Environment

```bash
# Set database credentials
export DB_HOST="andaralab-db.xxxx.ap-southeast-1.rds.amazonaws.com"
export DB_PORT="5432"
export DB_NAME="andaralab"
export DB_USER="andaralab_admin"
export DB_PASSWORD="YOUR_PASSWORD"

# Set AWS credentials
export AWS_REGION="ap-southeast-1"
export AWS_S3_BUCKET="andaralab-database-backups-production"
export AWS_S3_PREFIX="database-backups"
```

### 5.3 Run Manual Backup

```bash
# Make script executable
chmod +x scripts/backup-database.sh

# Run manual backup
./scripts/backup-database.sh manual

# List recent backups
./scripts/backup-database.sh list
```

The backup script will:
- Create a SQL dump of the database
- Compress it with gzip
- Upload to S3 with appropriate metadata
- Create backup metadata in S3
- Clean up temporary files

### 5.4 Restore from Backup (Optional)

```bash
# List backups to find timestamp
./scripts/backup-database.sh list

# Restore from specific backup
./scripts/backup-database.sh restore 20240129-120000
```

⚠️ **Warning:** Restore operation will overwrite the entire database. Use with caution.

## Step 6: Verify CloudTrail Logging

CloudTrail is configured to log all API activities to S3 with 100-year retention.

### 6.1 Check CloudTrail Status

```bash
aws cloudtrail describe-trails --trail-name-list andaralab-cloudtrail

aws cloudtrail get-trail-status --name andaralab-cloudtrail
```

### 6.2 View CloudTrail Logs

```bash
# List CloudTrail logs in S3
aws s3 ls s3://andaralab-cloudtrail-logs-production/AWSLogs/YOUR_ACCOUNT_ID/CloudTrail/

# Download specific log file
aws s3 cp s3://andaralab-cloudtrail-logs-production/.../log.json - | jq '.'
```

## Step 7: Monitor and Maintain

### 7.1 Monitor RDS Performance

```bash
# View RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=andaralab-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

### 7.2 Check Backup Status

```bash
# List RDS snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier andaralab-db \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,SnapshotType]'

# List S3 backups
aws s3 ls s3://andaralab-database-backups-production/database-backups/ --recursive
```

### 7.3 Review S3 Lifecycle Policies

```bash
# Get lifecycle configuration
aws s3api get-bucket-lifecycle-configuration \
  --bucket andaralab-database-backups-production

# Expected timeline:
# - 0-30 days: Standard
# - 30-90 days: Glacier
# - 90-365 days: Glacier IR
# - 365-36500 days (100 years): Deep Archive
# - After 100 years: Expired
```

## Step 8: Security Best Practices

### 8.1 Network Security

- RDS is deployed in private subnets (no public access)
- Security groups restrict access to specific CIDR blocks
- SSL/TLS is required for all database connections
- VPC flow logs can be enabled for network monitoring

### 8.2 Data Encryption

- RDS storage is encrypted at rest using AWS KMS
- S3 buckets use server-side encryption (AES256)
- Database connections use SSL/TLS
- KMS key rotation is enabled

### 8.3 Access Control

- Use IAM roles for Lambda and EC2 instances
- Follow principle of least privilege
- Rotate credentials regularly
- Enable MFA for root account and IAM users

### 8.4 Backup Security

- Backup files are encrypted in S3
- S3 bucket policies prevent public access
- Versioning is enabled on all S3 buckets
- CloudTrail logs all S3 and RDS API calls

## Step 9: Cost Optimization

### 9.1 Estimated Monthly Costs (ap-southeast-1)

- RDS db.t3.micro (Multi-AZ): ~$30-40/month
- S3 Standard (first 50TB): ~$0.023/GB
- S3 Glacier: ~$0.004/GB
- S3 Glacier Deep Archive: ~$0.00099/GB
- CloudTrail: ~Free (first copy, S3 storage costs apply)
- Lambda: ~$0.20 per 1M requests (negligible for daily backups)

**Total estimated cost:** ~$50-100/month for small to medium workloads

### 9.2 Cost Optimization Tips

- Use Reserved Instances for predictable workloads
- Enable RDS automated backups (35 days) for point-in-time recovery
- Monitor S3 storage usage and lifecycle transitions
- Set up CloudWatch billing alerts

## Step 10: Disaster Recovery

### 10.1 RDS Point-in-Time Recovery

RDS supports point-in-time recovery (PITR) within the backup retention window:

```bash
# Restore database to specific point in time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier andaralab-db \
  --target-db-instance-identifier andaralab-db-restored \
  --restore-time 2024-01-29T12:00:00Z \
  --db-subnet-group-name andaralab-db-subnet-group
```

### 10.2 Cross-Region Replication (Optional)

For additional disaster recovery, enable cross-region replication:

1. Create a read replica in another region
2. Enable automated backups on the replica
3. Set up cross-region S3 replication

## Troubleshooting

### Issue: Cannot connect to RDS

**Solution:**
- Check security group allows your IP
- Verify RDS is in available state
- Ensure SSL is enabled in connection string
- Check VPC routing if connecting from EC2

### Issue: Lambda backup fails

**Solution:**
- Check CloudWatch logs for Lambda function
- Verify IAM role has necessary permissions
- Ensure RDS instance is accessible
- Check S3 bucket permissions

### Issue: S3 lifecycle not working

**Solution:**
- Verify lifecycle policy is applied
- Check bucket versioning is enabled
- Ensure objects are older than transition days
- Review S3 bucket policy restrictions

### Issue: CloudTrail not logging

**Solution:**
- Verify CloudTrail is enabled
- Check S3 bucket policy allows CloudTrail
- Ensure CloudTrail service has write permissions
- Review CloudTrail status in AWS Console

## Maintenance Tasks

### Daily (Automated)
- Lambda function creates RDS snapshot at 3:00 AM
- CloudTrail logs all API activities

### Weekly
- Review CloudWatch metrics for RDS
- Check backup success in CloudWatch logs
- Verify S3 storage costs

### Monthly
- Review IAM access and rotate credentials
- Audit CloudTrail logs for suspicious activity
- Review and update security group rules
- Check RDS maintenance window

### Quarterly
- Review and update Terraform configuration
- Test disaster recovery procedures
- Review cost optimization opportunities
- Audit compliance requirements

## Support and Documentation

- AWS Documentation: https://docs.aws.amazon.com/
- Terraform Documentation: https://www.terraform.io/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/

## Summary

This setup provides:
- Highly available database with Multi-AZ RDS
- 100-year data retention via S3 lifecycle policies
- Comprehensive activity logging via CloudTrail
- Automated daily backups via Lambda
- Manual backup capability via shell script
- Point-in-time recovery via RDS
- Encryption at rest for all data
- Secure network configuration with VPC
- Cost-effective storage with Glacier tiers

All database activities and data changes are logged and retained for 100 years, ensuring complete auditability and compliance with long-term data retention requirements.
