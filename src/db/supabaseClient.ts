import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getEnvConfig } from "../config/env";

export type DbClient = SupabaseClient<any, "public", any>;

function getRuntimeCredentials() {
  const env = getEnvConfig();

  if (env.nodeEnv === "test") {
    return {
      url: env.testSupabaseUrl ?? env.supabaseUrl,
      secret: env.testSupabaseSecretKey ?? env.supabaseSecretKey
    };
  }

  if (env.nodeEnv === "production") {
    return {
      url: env.prodSupabaseUrl ?? env.supabaseUrl,
      secret: env.prodSupabaseSecretKey ?? env.supabaseSecretKey
    };
  }

  return {
    url: env.supabaseUrl,
    secret: env.supabaseSecretKey
  };
}

export function createSupabaseClient(): DbClient {
  const { url, secret } = getRuntimeCredentials();

  if (!url || !secret) {
    throw new Error(
      "Missing Supabase credentials for current NODE_ENV. Check your .env files or CI secrets."
    );
  }

  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
