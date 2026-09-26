export type CacheBackend = "redis" | "memory";

export type CacheLookup<T> =
  | { hit: true; value: T }
  | { hit: false };

export type CacheStats = {
  backend: CacheBackend;
  hits: number;
  misses: number;
};

export interface CacheClient {
  readonly backend: CacheBackend;
  get<T>(key: string): Promise<CacheLookup<T>>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(keys: string[]): Promise<void>;
  ping(): Promise<boolean>;
  stats(): CacheStats;
}
