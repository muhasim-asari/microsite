import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_USER;
const password = process.env.SQL_PASSWORD;

if (!sqlHost || !sqlDbName || !user || !password) {
  throw new Error("Missing database connection environment variables.");
}

const client = postgres({
  host: sqlHost,
  database: sqlDbName,
  user: user,
  password: password,
  max: 10,
  ssl: false
});

export const db = drizzle(client, { schema });
