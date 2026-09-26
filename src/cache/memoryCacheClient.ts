import { CacheClient, CacheLookup, CacheStats } from "./cacheClient";

type MemoryEntry = {
  expiresAt: number;
  value: string;
};

export class MemoryCacheClient implements CacheClient {
  readonly backend = "memory" as const;
  private readonly store = new Map<string, MemoryEntry>();
  private hits = 0;
  private misses = 0;

  async get<T>(key: string): Promise<CacheLookup<T>> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return { hit: false };
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.misses += 1;
      return { hit: false };
    }

    this.hits += 1;
    return { hit: true, value: JSON.parse(entry.value) as T };
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async del(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.store.delete(key);
    }
  }

  async ping(): Promise<boolean> {
    return true;
  }

  stats(): CacheStats {
    return {
      backend: this.backend,
      hits: this.hits,
      misses: this.misses
    };
  }
}
