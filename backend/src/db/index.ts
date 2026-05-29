import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

/**
 * postgres-js client.
 * max: 10 — sane default for a single backend instance.
 * For read-heavy workloads this will be extracted to a read-replica pool.
 */
const sql = postgres(connectionString, { max: 10 });

export const db = drizzle(sql, { schema, logger: process.env.NODE_ENV === "development" });

export type Database = typeof db;
