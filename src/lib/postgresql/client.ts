import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function getPostgresPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  pool ??= new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  return pool;
}

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return getPostgresPool().query<T>(text, values);
}
