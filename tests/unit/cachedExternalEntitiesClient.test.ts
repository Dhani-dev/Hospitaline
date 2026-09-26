import { describe, expect, it, vi } from "vitest";
import { CachedExternalEntitiesClient } from "../../src/integrations/cachedExternalEntitiesClient";
import { MemoryCacheClient } from "../../src/cache/memoryCacheClient";

describe("CachedExternalEntitiesClient", () => {
  it("caches live peer responses and skips a second HTTP call", async () => {
    const inner = {
      getLastUser: vi.fn().mockResolvedValue({
        live: true,
        entity: "users",
        data: { id: "u1" }
      }),
      getLastEntrenador: vi.fn().mockResolvedValue({
        live: true,
        entity: "entrenador",
        data: { id: "e1" }
      }),
      getPeers: vi.fn()
    };
    const client = new CachedExternalEntitiesClient(
      inner,
      new MemoryCacheClient(),
      60
    );

    const first = await client.getPeers("trace-1");
    const second = await client.getPeers("trace-2");

    expect(first).toEqual(second);
    expect(inner.getLastUser).toHaveBeenCalledTimes(1);
    expect(inner.getLastEntrenador).toHaveBeenCalledTimes(1);
  });

  it("does not cache offline peers so the next request retries", async () => {
    const inner = {
      getLastUser: vi
        .fn()
        .mockResolvedValueOnce({ live: false, entity: "users", data: null })
        .mockResolvedValueOnce({ live: true, entity: "users", data: { id: "u2" } }),
      getLastEntrenador: vi.fn().mockResolvedValue({
        live: false,
        entity: "entrenador",
        data: null
      }),
      getPeers: vi.fn()
    };
    const client = new CachedExternalEntitiesClient(
      inner,
      new MemoryCacheClient(),
      60
    );

    const first = await client.getLastUser("t1");
    const second = await client.getLastUser("t2");

    expect(first.live).toBe(false);
    expect(second).toEqual({ live: true, entity: "users", data: { id: "u2" } });
    expect(inner.getLastUser).toHaveBeenCalledTimes(2);
  });
});
