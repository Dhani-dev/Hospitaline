import { createClient, RedisClientType } from "redis";
import { CacheClient, CacheLookup, CacheStats } from "./cacheClient";

export class RedisCacheClient implements CacheClient {
  readonly backend = "redis" as const;
  private readonly client: RedisClientType;
  private readonly ready: Promise<void>;
  private hits = 0;
  private misses = 0;

  constructor(host: string, port: number, password?: string) {
    this.client = createClient({
      socket: {
        host,
        port,
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
      },
      password: password || undefined
    });
    this.client.on("error", () => undefined);
    this.ready = this.client.connect().then(() => undefined);
  }

  async get<T>(key: string): Promise<CacheLookup<T>> {
    try {
      await this.ready;
      const raw = await this.client.get(key);
      if (raw === null) {
        this.misses += 1;
        return { hit: false };
      }

      this.hits += 1;
      return { hit: true, value: JSON.parse(raw) as T };
    } catch {
      this.misses += 1;
      return { hit: false };
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.ready;
      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch {
      return;
    }
  }

  async del(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    try {
      await this.ready;
      await this.client.del(keys);
    } catch {
      return;
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.ready;
      return (await this.client.ping()) === "PONG";
    } catch {
      return false;
    }
  }

  stats(): CacheStats {
    return {
      backend: this.backend,
      hits: this.hits,
      misses: this.misses
    };
  }
}
