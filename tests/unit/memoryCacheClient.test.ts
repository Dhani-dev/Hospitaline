import { describe, expect, it } from "vitest";
import { MemoryCacheClient } from "../../src/cache/memoryCacheClient";

describe("MemoryCacheClient", () => {
  it("stores values until TTL expires", async () => {
    const cache = new MemoryCacheClient();

    await cache.set("k", { id: 1 }, 60);
    const hit = await cache.get<{ id: number }>("k");

    expect(hit).toEqual({ hit: true, value: { id: 1 } });
    expect(cache.stats().hits).toBe(1);
  });

  it("expires values after TTL", async () => {
    const cache = new MemoryCacheClient();
    await cache.set("k", "v", 0);
    await new Promise((resolve) => setTimeout(resolve, 5));

    const miss = await cache.get("k");
    expect(miss).toEqual({ hit: false });
    expect(cache.stats().misses).toBe(1);
  });

  it("deletes keys on invalidation", async () => {
    const cache = new MemoryCacheClient();
    await cache.set("a", 1, 60);
    await cache.set("b", 2, 60);
    await cache.del(["a"]);

    expect(await cache.get("a")).toEqual({ hit: false });
    expect(await cache.get("b")).toEqual({ hit: true, value: 2 });
  });
});
