import { Pool } from "pg";
import { getEnvConfig } from "../config/env";

const env = getEnvConfig();

const pool = new Pool({
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword
});

export default pool;