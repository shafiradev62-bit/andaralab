/**
 * AWS RDS PostgreSQL Configuration
 * 
 * This module provides configuration for connecting to AWS RDS PostgreSQL
 * with support for both local development and production environments.
 * 
 * Environment Variables:
 *   DATABASE_URL              - Full PostgreSQL connection string (highest priority)
 *   DB_HOST                  - RDS endpoint hostname
 *   DB_PORT                  - Database port (default: 5432)
 *   DB_NAME                  - Database name
 *   DB_USER                  - Database username
 *   DB_PASSWORD              - Database password
 *   AWS_RDS_ENDPOINT         - AWS RDS endpoint (alternative to DB_HOST)
 *   AWS_RDS_REGION           - AWS region for RDS
 *   USE_SSL                  - Force SSL connection (default: true for production)
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  connectionString?: string;
}

/**
 * Get database configuration from environment variables
 * Priority: DATABASE_URL > Individual DB_* vars > AWS_RDS_* vars > Defaults
 */
export function getDatabaseConfig(): DatabaseConfig {
  // If DATABASE_URL is provided, use it (highest priority)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      host: '',
      port: 5432,
      database: '',
      user: '',
      password: '',
      ssl: isProduction(),
    };
  }

  // Build connection from individual environment variables
  const host = process.env.DB_HOST || process.env.AWS_RDS_ENDPOINT || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.DB_NAME || 'andaralab';
  const user = process.env.DB_USER || process.env.AWS_RDS_USER || 'postgres';
  const password = process.env.DB_PASSWORD || process.env.AWS_RDS_PASSWORD || '';
  
  // SSL is required for AWS RDS in production
  const ssl = process.env.USE_SSL === 'false' ? false : isProduction();

  const config: DatabaseConfig = {
    host,
    port,
    database,
    user,
    password,
    ssl,
  };

  // Build connection string if not provided
  config.connectionString = buildConnectionString(config);

  return config;
}

/**
 * Build PostgreSQL connection string from config
 */
export function buildConnectionString(config: DatabaseConfig): string {
  if (config.connectionString) {
    return config.connectionString;
  }

  const sslParam = config.ssl ? '?sslmode=require' : '';
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}${sslParam}`;
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  const env = process.env.NODE_ENV || process.env.ENVIRONMENT || 'development';
  return env === 'production' || env === 'prod';
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.connectionString && !config.host) {
    errors.push('Database host is required (set DATABASE_URL or DB_HOST)');
  }

  if (!config.connectionString && !config.user) {
    errors.push('Database user is required (set DATABASE_URL or DB_USER)');
  }

  if (!config.connectionString && !config.password && isProduction()) {
    errors.push('Database password is required in production (set DATABASE_URL or DB_PASSWORD)');
  }

  if (!config.connectionString && !config.database) {
    errors.push('Database name is required (set DATABASE_URL or DB_NAME)');
  }

  if (config.port && (config.port < 1 || config.port > 65535)) {
    errors.push('Invalid database port');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log database configuration (without sensitive data)
 */
export function logDatabaseConfig(): void {
  const config = getDatabaseConfig();
  const validation = validateDatabaseConfig(config);

  if (!validation.valid) {
    console.error('[DB] Configuration errors:', validation.errors);
  }

  console.log('[DB] Database Configuration:');
  console.log(`[DB]   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[DB]   Host: ${config.host || 'from DATABASE_URL'}`);
  console.log(`[DB]   Port: ${config.port}`);
  console.log(`[DB]   Database: ${config.database || 'from DATABASE_URL'}`);
  console.log(`[DB]   User: ${config.user || 'from DATABASE_URL'}`);
  console.log(`[DB]   SSL: ${config.ssl}`);
  console.log(`[DB]   Connection String: ${config.connectionString ? '*** (from DATABASE_URL)' : 'built from env vars'}`);
}

/**
 * AWS RDS-specific configuration
 */
export interface RDSConfig {
  endpoint: string;
  port: number;
  region: string;
  instanceId: string;
  multiAZ: boolean;
  backupRetentionDays: number;
}

/**
 * Get AWS RDS configuration from environment
 */
export function getRDSConfig(): RDSConfig | null {
  if (!process.env.AWS_RDS_ENDPOINT) {
    return null;
  }

  return {
    endpoint: process.env.AWS_RDS_ENDPOINT,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    region: process.env.AWS_RDS_REGION || process.env.AWS_REGION || 'ap-southeast-1',
    instanceId: process.env.AWS_RDS_INSTANCE_ID || 'andaralab-db',
    multiAZ: process.env.AWS_RDS_MULTI_AZ === 'true',
    backupRetentionDays: parseInt(process.env.AWS_RDS_BACKUP_RETENTION || '35', 10),
  };
}

/**
 * Log AWS RDS configuration
 */
export function logRDSConfig(): void {
  const config = getRDSConfig();
  
  if (!config) {
    console.log('[RDS] Not using AWS RDS (local database)');
    return;
  }

  console.log('[RDS] AWS RDS Configuration:');
  console.log(`[RDS]   Endpoint: ${config.endpoint}`);
  console.log(`[RDS]   Port: ${config.port}`);
  console.log(`[RDS]   Region: ${config.region}`);
  console.log(`[RDS]   Instance ID: ${config.instanceId}`);
  console.log(`[RDS]   Multi-AZ: ${config.multiAZ}`);
  console.log(`[RDS]   Backup Retention: ${config.backupRetentionDays} days`);
}
