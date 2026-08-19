import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";
import { ServiceContainer } from "../../src/bootstrap/createServices";
import { Doctor } from "../../src/types/entities";
import { isoNow } from "../helpers/testUtils";

describe("Doctor routes", () => {
  let app = buildApp(makeServices());

  function makeServices(): ServiceContainer {
    const db = new Map<string, Doctor>();
    const now = isoNow();
    const seed: Doctor = {
      id: "22222222-2222-4222-8222-222222222222",
      hospital_id: "11111111-1111-4111-8111-111111111111",
      first_name: "Ana",
      last_name: "Lopez",
      specialty: "Cardiology",
      email: "ana@example.com",
      created_at: now,
      updated_at: now
    };
    db.set(seed.id, seed);

    return {
      hospitalService: {} as any,
      doctorService: {
        list: async () => Array.from(db.values()),
        getById: async (id) => db.get(id) ?? null,
        create: async (payload) => {
          const entity: Doctor = {
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
          const entity: Doctor = { ...current, ...payload, updated_at: isoNow() };
          db.set(id, entity);
          return entity;
        },
        patch: async (id, payload) => {
          const current = db.get(id);
          if (!current) return null;
          const entity: Doctor = { ...current, ...payload, updated_at: isoNow() };
          db.set(id, entity);
          return entity;
        },
        remove: async (id) => db.delete(id),
        query: async ({ filters }) => {
          const rows = Array.from(db.values()).filter((item) => {
            if (filters?.specialty && !item.specialty.includes(filters.specialty)) return false;
            if (filters?.last_name && !item.last_name.includes(filters.last_name)) return false;
            return true;
          });
          return { data: rows, page: 1, pageSize: 20, total: rows.length };
        }
      },
      pacienteService: {} as any
    };
  }

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/doctors", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/doctors" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).length).toBeGreaterThan(0);
  });

  it("POST /api/v1/doctors", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/doctors",
      payload: {
        hospital_id: "11111111-1111-4111-8111-111111111111",
        first_name: "Luis",
        last_name: "Perez",
        specialty: "Neurology",
        email: "luis@example.com"
      }
    });
    expect(res.statusCode).toBe(201);
  });

  it("PUT /api/v1/doctors/:id", async () => {
    const list = await app.inject({ method: "GET", url: "/api/v1/doctors" });
    const id = JSON.parse(list.payload)[0].id;

    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/doctors/${id}`,
      payload: {
        hospital_id: "11111111-1111-4111-8111-111111111111",
        first_name: "Ana",
        last_name: "Lopez",
        specialty: "Dermatology",
        email: "ana@example.com"
      }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).specialty).toBe("Dermatology");
  });

  it("PATCH /api/v1/doctors/:id", async () => {
    const list = await app.inject({ method: "GET", url: "/api/v1/doctors" });
    const id = JSON.parse(list.payload)[0].id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/doctors/${id}`,
      payload: { specialty: "Pediatrics" }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).specialty).toBe("Pediatrics");
  });

  it("QUERY /api/v1/doctors/query", async () => {
    const res = await app.inject({
      method: "QUERY",
      url: "/api/v1/doctors/query",
      payload: { filters: { specialty: "Pediatrics" } }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).data.length).toBeGreaterThanOrEqual(1);
  });

  it("DELETE /api/v1/doctors/:id", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/doctors",
      payload: {
        hospital_id: "11111111-1111-4111-8111-111111111111",
        first_name: "Maria",
        last_name: "Suarez",
        specialty: "Oncology",
        email: "maria@example.com"
      }
    });
    const id = JSON.parse(created.payload).id;

    const res = await app.inject({ method: "DELETE", url: `/api/v1/doctors/${id}` });
    expect(res.statusCode).toBe(204);
  });

  it("returns 404 when doctor is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/doctors/00000000-0000-4000-8000-000000000000"
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 on invalid doctor payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/doctors",
      payload: {
        hospital_id: "not-uuid",
        first_name: "",
        last_name: "",
        specialty: "",
        email: "invalid"
      }
    });
    expect(res.statusCode).toBe(400);
  });
});
