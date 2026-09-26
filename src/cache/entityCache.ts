import { LocalEntityName } from "../types/entities";
import { CacheClient } from "./cacheClient";
import { cacheKeys } from "./keys";

export class EntityCache {
  constructor(
    private readonly cache: CacheClient,
    private readonly ttlSeconds: number
  ) {}

  async readThrough<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached.hit) {
      return cached.value;
    }

    const value = await loader();
    if (value !== null && value !== undefined) {
      await this.cache.set(key, value, this.ttlSeconds);
    }

    return value;
  }

  invalidateLocal(entity: LocalEntityName, id?: string): Promise<void> {
    const keys = [cacheKeys.last(entity)];
    if (id) {
      keys.push(cacheKeys.local(entity, id));
    }
    return this.cache.del(keys);
  }
}
