import { EnvConfig } from "../config/env";
import { CacheClient } from "./cacheClient";
import { MemoryCacheClient } from "./memoryCacheClient";
import { RedisCacheClient } from "./redisCacheClient";

export function createCacheClient(env: EnvConfig): CacheClient {
  if (!env.redisHost) {
    return new MemoryCacheClient();
  }

  return new RedisCacheClient(env.redisHost, env.redisPort, env.redisPassword);
}
