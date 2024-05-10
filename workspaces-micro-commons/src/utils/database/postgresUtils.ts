
import { Pool, PoolConfig, QueryConfig, QueryResult } from "pg";
import {
  getStringEnvVariableOrDefault,
  getBooleanEnvVariableOrDefault,
  getStringEnvVariable,
} from "../config/envUtils";
import { loggerUtils } from "../monitoring/loggerUtils";
import fs from "fs";
import path from "path";

const postgresConfig: PoolConfig = {
  user: getStringEnvVariableOrDefault("WORKSPACES_POSTGRES_USERNAME", "postgres"),
  host: getStringEnvVariableOrDefault("WORKSPACES_POSTGRES_HOST", "localhost"),
  database: getStringEnvVariableOrDefault(
    "WORKSPACES_POSTGRES_DATABASE",
    "postgres"
  ),
  password: getStringEnvVariableOrDefault(
    "WORKSPACES_POSTGRES_PASSWORD",
    "password"
  ),
  port: parseInt(getStringEnvVariableOrDefault("WORKSPACES_POSTGRES_PORT", "5432")),
  ssl: getBooleanEnvVariableOrDefault("WORKSPACES_POSTGRES_ENABLE_SSL", false)
    ? {
        rejectUnauthorized: getBooleanEnvVariableOrDefault(
          "WORKSPACES_POSTGRES_REJECT_UNAUTHORIZED",
          true
        ),
        ca: [
          fs.readFileSync(
            getStringEnvVariableOrDefault("WORKSPACES_POSTGRES_CA_PATH", "")
          ),
        ],
        key: fs.readFileSync(
          getStringEnvVariableOrDefault("WORKSPACES_POSTGRES_KEY_PATH", "")
        ),
        cert: fs.readFileSync(
          getStringEnvVariableOrDefault("WORKSPACES_POSTGRES_CERT_PATH", "")
        ),
      }
    : false,
};

const pool = new Pool(postgresConfig);

export async function query<T extends QueryResult = any>(
  query: QueryConfig
): Promise<QueryResult<T>> {
  try {
    const start = Date.now();
    const result = await pool.query<T>(query);
    const duration = Date.now() - start;
    loggerUtils.debug(
      `postgresUtils :: query :: Query executed in ${duration}ms :: ${query.text}`,
      query.values
    );
    return result;
  } catch (error) {
    loggerUtils.error(
      `postgresUtils :: query :: Error executing query :: ${error}`
    );
    throw error;
  }
}

export async function connectPool(): Promise<void> {
  try {
    await pool.connect();
    loggerUtils.info(
      "postgresUtils :: connectPool :: PostgreSQL Connection Pool Connected"
    );
  } catch (error) {
    loggerUtils.error(
      `postgresUtils :: closePool :: Error closing PostgreSQL connection pool :: ${error}`
    );
    throw error;
  }
}

export async function closePool(): Promise<void> {
  try {
    await pool.end();
    loggerUtils.info(
      "postgresUtils :: closePool :: PostgreSQL Connection Pool Closed"
    );
  } catch (error) {
    loggerUtils.error(
      `postgresUtils :: closePool :: Error closing PostgreSQL connection pool :: ${error}`
    );
    throw error;
  }
}

export async function runMigrations<
  T extends QueryResult = any
>(): Promise<void> {
  try {
    if (
      getBooleanEnvVariableOrDefault("WORKSPACES_POSTGRES_ENABLE_MIGRATIONS", false)
    ) {
      const migrationPath = getStringEnvVariable(
        "WORKSPACES_POSTGRES_MIGRATION_PATH"
      );

      if (migrationPath) {
        const files = fs.readdirSync(migrationPath);
        for (const file of files) {
          const filePath = path.join(migrationPath, file);
          const sql = fs.readFileSync(filePath, "utf-8");

          await pool.query<T>(sql);

          loggerUtils.debug(
            `postgresUtils :: runMigrations :: Migrated: ${filePath}`
          );
        }

        loggerUtils.info(
          "postgresUtils :: runMigrations :: All migrations executed successfully."
        );
      }
    }
  } catch (error) {
    loggerUtils.error(
      `postgresUtils :: runMigrations :: Error executing migrations :: ${error}`
    );
    throw error;
  }
}
