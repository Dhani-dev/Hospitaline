import dotenv from "dotenv";

export type RuntimeEnv = "development" | "test" | "production";

export type EnvConfig = {
  nodeEnv: RuntimeEnv;
  port: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  usersApiUrl: string;
  usersLastPath: string;
  usersListPath: string;
  entrenadorApiUrl: string;
  entrenadorLastPath: string;
  entrenadorListPath: string;
};

let cachedEnv: EnvConfig | null = null;

function loadEnvFile(nodeEnv: RuntimeEnv): void {
  const envFile =
    nodeEnv === "test"
      ? ".env.test"
      : nodeEnv === "production"
        ? ".env.prod"
        : ".env";

  dotenv.config({ path: envFile });
}

function optionalUrl(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function getEnvConfig(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const nodeEnv = (process.env.NODE_ENV ?? "development") as RuntimeEnv;
  loadEnvFile(nodeEnv);

  const dbHost = process.env.DB_HOST ?? "127.0.0.1";
  const dbPort = Number(process.env.DB_PORT ?? 5432);
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;

  if (!dbName) {
    throw new Error("Missing DB_NAME environment variable.");
  }

  if (!dbUser) {
    throw new Error("Missing DB_USER environment variable.");
  }

  if (!dbPassword) {
    throw new Error("Missing DB_PASSWORD environment variable.");
  }

  cachedEnv = {
    nodeEnv,
    port: Number(process.env.PORT ?? 3000),
    dbHost,
    dbPort,
    dbName,
    dbUser,
    dbPassword,
    usersApiUrl: optionalUrl(process.env.USERS_API_URL),
    usersLastPath: process.env.USERS_LAST_PATH ?? "/api/v2/users/last",
    usersListPath: process.env.USERS_LIST_PATH ?? "/api/users",
    entrenadorApiUrl: optionalUrl(process.env.ENTRENADOR_API_URL),
    entrenadorLastPath: process.env.ENTRENADOR_LAST_PATH ?? "/api/v2/entrenador/last",
    entrenadorListPath: process.env.ENTRENADOR_LIST_PATH ?? "/entrenador"
  };

  return cachedEnv;
}
