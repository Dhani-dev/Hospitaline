import dotenv from "dotenv";

export type RuntimeEnv = "development" | "test" | "production";

export type EnvConfig = {
  nodeEnv: RuntimeEnv;
  port: number;
  supabaseUrl?: string;
  supabaseSecretKey?: string;
  supabasePublishableKey?: string;
  supabaseJwksUrl?: string;
  testSupabaseUrl?: string;
  testSupabaseSecretKey?: string;
  prodSupabaseUrl?: string;
  prodSupabaseSecretKey?: string;
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

export function getEnvConfig(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const nodeEnv = (process.env.NODE_ENV ?? "development") as RuntimeEnv;
  loadEnvFile(nodeEnv);

  cachedEnv = {
    nodeEnv,
    port: Number(process.env.PORT ?? 3000),
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    supabaseJwksUrl: process.env.SUPABASE_JWKS_URL,
    testSupabaseUrl: process.env.TEST_SUPABASE_URL,
    testSupabaseSecretKey: process.env.TEST_SUPABASE_SECRET_KEY,
    prodSupabaseUrl: process.env.PROD_SUPABASE_URL,
    prodSupabaseSecretKey: process.env.PROD_SUPABASE_SECRET_KEY
  };

  return cachedEnv;
}
