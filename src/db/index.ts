import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_USER;
const password = process.env.SQL_PASSWORD;

let client;

// Allow Vercel deployment with single connection string OR local AI studio with injected variables
if (connectionString) {
  client = postgres(connectionString, { max: 10 });
} else if (sqlHost && sqlDbName && user && password) {
  client = postgres({
    host: sqlHost,
    database: sqlDbName,
    user: user,
    password: password,
    max: 10,
    ssl: false
  });
} else {
  throw new Error("Missing database connection environment variables.");
}

export const db = drizzle(client, { schema });
