import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { getDatabaseConfig, validateDatabaseConfig, logDatabaseConfig, logRDSConfig } from "./aws-config";

const { Pool } = pg;

// Get database configuration with AWS RDS support
const dbConfig = getDatabaseConfig();
const validation = validateDatabaseConfig(dbConfig);

if (!validation.valid) {
  throw new Error(
    `Database configuration error: ${validation.errors.join(', ')}. Please set DATABASE_URL or individual DB_* environment variables.`,
  );
}

// Log configuration (without sensitive data)
logDatabaseConfig();
logRDSConfig();

// Create connection pool
export const pool = new Pool({
  connectionString: dbConfig.connectionString,
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  ssl: dbConfig.ssl ? {
    rejectUnauthorized: false, // For AWS RDS with self-signed certificates
  } : false,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
