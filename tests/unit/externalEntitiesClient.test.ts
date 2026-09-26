import { describe, expect, it, vi } from "vitest";
import {
  HttpExternalEntitiesClient,
  pickLastRecord
} from "../../src/integrations/externalEntitiesClient";

describe("pickLastRecord", () => {
  it("unwraps pokenetes last envelopes", () => {
    expect(
      pickLastRecord({
        api: "pokenetes",
        local: { id: "1", nombre: "Ash" }
      })
    ).toEqual({ id: "1", nombre: "Ash" });
  });

  it("takes the last item from a list", () => {
    expect(pickLastRecord([{ id: 1 }, { id: 2 }])).toEqual({ id: 2 });
  });
});

describe("HttpExternalEntitiesClient", () => {
  it("propagates x-trace-id and uses last before the list fallback", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ local: { id: "e1", nombre: "Ash" } })
    });
    const client = new HttpExternalEntitiesClient(
      { baseUrl: "", lastPath: "/api/v2/users/last", listPath: "/api/users" },
      {
        baseUrl: "https://pokenetes.example.com",
        lastPath: "/api/v2/entrenador/last",
        listPath: "/entrenador"
      },
      fetcher
    );

    const peers = await client.getPeers("trace-abc");

    expect(peers["biblio-express"]).toEqual({
      live: false,
      entity: "users",
      data: null
    });
    expect(peers.pokenetes).toEqual({
      live: true,
      entity: "entrenador",
      data: { id: "e1", nombre: "Ash" }
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://pokenetes.example.com/api/v2/entrenador/last",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-trace-id": "trace-abc" })
      })
    );
  });

  it("falls back to the list endpoint when last is missing", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, text: async () => "missing" })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "u1" }, { id: "u2", name: "Ada" }]
      });
    const client = new HttpExternalEntitiesClient(
      { baseUrl: "https://biblio.example.com", lastPath: "/api/v2/users/last", listPath: "/api/users" },
      { baseUrl: "", lastPath: "/api/v2/entrenador/last", listPath: "/entrenador" },
      fetcher
    );

    const user = await client.getLastUser("trace-1");

    expect(user).toEqual({
      live: true,
      entity: "users",
      data: { id: "u2", name: "Ada" }
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "https://biblio.example.com/api/users",
      expect.anything()
    );
  });

  it("marks the peer offline when the remote call fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("timeout"));
    const client = new HttpExternalEntitiesClient(
      { baseUrl: "https://biblio.example.com", lastPath: "/api/v2/users/last", listPath: "/api/users" },
      { baseUrl: "https://pokenetes.example.com", lastPath: "/last", listPath: "/list" },
      fetcher
    );

    const peers = await client.getPeers("trace-1");

    expect(peers["biblio-express"].live).toBe(false);
    expect(peers.pokenetes.live).toBe(false);
    expect(peers["biblio-express"].data).toBeNull();
  });
});
