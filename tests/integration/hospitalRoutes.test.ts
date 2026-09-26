import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";
import { ServiceContainer } from "../../src/bootstrap/createServices";
import { Hospital } from "../../src/types/entities";
import { isoNow } from "../helpers/testUtils";

describe("Hospital routes", () => {
  let app = buildApp(makeServices());

  function makeServices(): ServiceContainer {
    const db = new Map<string, Hospital>();
    const now = isoNow();
    const seed: Hospital = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Central",
      address: "A Street",
      city: "Bogota",
      phone: "5551234",
      created_at: now,
      updated_at: now
    };
    db.set(seed.id, seed);

    return {
      hospitalService: {
        list: async () => Array.from(db.values()),
        getById: async (id) => db.get(id) ?? null,
        getLast: async () => Array.from(db.values()).at(-1) ?? null,
        getByIdV2: async (id, traceId) => {
          const local = db.get(id);
          if (!local) return null;
          return {
            api: "hospitaline",
            version: "2.0.0",
            trace_id: traceId,
            entity: "hospital",
            local,
            peers: {
              "biblio-express": { live: false, entity: "users", data: null },
              pokenetes: { live: false, entity: "entrenador", data: null }
            }
          };
        },
        create: async (payload) => {
          const entity: Hospital = {
            id: crypto.randomUUID(),
            ...payload,
            created_at: isoNow(),
            updated_at: isoNow()
          };
          db.set(entity.id, entity);
          return entity;
        },
        replace: async (id, payload) => {
          const current = db.get(id);
          if (!current) return null;
          const entity: Hospital = { ...current, ...payload, updated_at: isoNow() };
          db.set(id, entity);
          return entity;
        },
        patch: async (id, payload) => {
          const current = db.get(id);
          if (!current) return null;
          const entity: Hospital = { ...current, ...payload, updated_at: isoNow() };
          db.set(id, entity);
          return entity;
        },
        remove: async (id) => db.delete(id),
        query: async ({ filters }) => {
          const rows = Array.from(db.values()).filter((item) => {
            if (filters?.name && !item.name.includes(filters.name)) return false;
            if (filters?.city && !item.city.includes(filters.city)) return false;
            return true;
          });
          return { data: rows, page: 1, pageSize: 20, total: rows.length };
        }
      },
      doctorService: {} as any,
      pacienteService: {} as any
    };
  }

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/hospitals", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/hospitals" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toHaveLength(1);
  });

  it("POST /api/v1/hospitals", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/hospitals",
      payload: {
        name: "North",
        address: "B Street",
        city: "Medellin",
        phone: "5559999"
      }
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.payload).name).toBe("North");
  });

  it("PUT /api/v1/hospitals/:id", async () => {
    const list = await app.inject({ method: "GET", url: "/api/v1/hospitals" });
    const id = JSON.parse(list.payload)[0].id;

    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/hospitals/${id}`,
      payload: {
        name: "Central Updated",
        address: "New Street",
        city: "Bogota",
        phone: "1231234"
      }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).name).toBe("Central Updated");
  });

  it("PATCH /api/v1/hospitals/:id", async () => {
    const list = await app.inject({ method: "GET", url: "/api/v1/hospitals" });
    const id = JSON.parse(list.payload)[0].id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/hospitals/${id}`,
      payload: { city: "Cali" }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).city).toBe("Cali");
  });

  it("QUERY /api/v1/hospitals/query", async () => {
    const res = await app.inject({
      method: "QUERY",
      url: "/api/v1/hospitals/query",
      payload: { filters: { city: "Cali" } }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).data.length).toBeGreaterThanOrEqual(1);
  });

  it("DELETE /api/v1/hospitals/:id", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/hospitals",
      payload: {
        name: "South",
        address: "X Street",
        city: "Barranquilla",
        phone: "2222222"
      }
    });
    const id = JSON.parse(created.payload).id;

    const res = await app.inject({ method: "DELETE", url: `/api/v1/hospitals/${id}` });
    expect(res.statusCode).toBe(204);
  });

  it("GET /api/v2/hospitals/last returns the last local hospital without peers", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v2/hospitals/last" });
    const body = JSON.parse(res.payload);

    expect(res.statusCode).toBe(200);
    expect(body.api).toBe("hospitaline");
    expect(body.version).toBe("2.0.0");
    expect(body.entity).toBe("hospital");
    expect(body.local).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String)
      })
    );
    expect(body.peers).toBeUndefined();
    expect(typeof body.trace_id).toBe("string");
  });

  it("returns 404 when hospital is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/hospitals/00000000-0000-4000-8000-000000000000"
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 on invalid hospital payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/hospitals",
      payload: {
        name: "",
        address: "",
        city: "",
        phone: "12"
      }
    });
    expect(res.statusCode).toBe(400);
  });
});
