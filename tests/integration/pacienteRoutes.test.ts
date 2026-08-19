import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";
import { ServiceContainer } from "../../src/bootstrap/createServices";
import { Paciente } from "../../src/types/entities";
import { isoNow } from "../helpers/testUtils";

describe("Paciente routes", () => {
  let app = buildApp(makeServices());

  function makeServices(): ServiceContainer {
    const db = new Map<string, Paciente>();
    const now = isoNow();
    const seed: Paciente = {
      id: "33333333-3333-4333-8333-333333333333",
      hospital_id: "11111111-1111-4111-8111-111111111111",
      doctor_id: "22222222-2222-4222-8222-222222222222",
      first_name: "Julia",
      last_name: "Rios",
      birth_date: "1990-05-20",
      condition: "Observation",
      status: "stable",
      created_at: now,
      updated_at: now
    };
    db.set(seed.id, seed);

    return {
      hospitalService: {} as any,
      doctorService: {} as any,
      pacienteService: {
        list: async () => Array.from(db.values()),
        getById: async (id) => db.get(id) ?? null,
        create: async (payload) => {
          const entity: Paciente = {
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
          const entity: Paciente = { ...current, ...payload, updated_at: isoNow() };
          db.set(id, entity);
          return entity;
        },
        patch: async (id, payload) => {
          const current = db.get(id);
          if (!current) return null;
          const entity: Paciente = { ...current, ...payload, updated_at: isoNow() };
          db.set(id, entity);
          return entity;
        },
        remove: async (id) => db.delete(id),
        query: async ({ filters }) => {
          const rows = Array.from(db.values()).filter((item) => {
            if (filters?.status && item.status !== filters.status) return false;
            if (filters?.condition && !item.condition.includes(filters.condition)) return false;
            return true;
          });
          return { data: rows, page: 1, pageSize: 20, total: rows.length };
        }
      }
    };
  }

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/pacientes", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/pacientes" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).length).toBeGreaterThan(0);
  });

  it("POST /api/v1/pacientes", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/pacientes",
      payload: {
        hospital_id: "11111111-1111-4111-8111-111111111111",
        doctor_id: "22222222-2222-4222-8222-222222222222",
        first_name: "Leo",
        last_name: "Mora",
        birth_date: "2000-01-01",
        condition: "Recovery",
        status: "stable"
      }
    });
    expect(res.statusCode).toBe(201);
  });

  it("PUT /api/v1/pacientes/:id", async () => {
    const list = await app.inject({ method: "GET", url: "/api/v1/pacientes" });
    const id = JSON.parse(list.payload)[0].id;

    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/pacientes/${id}`,
      payload: {
        hospital_id: "11111111-1111-4111-8111-111111111111",
        doctor_id: "22222222-2222-4222-8222-222222222222",
        first_name: "Julia",
        last_name: "Rios",
        birth_date: "1990-05-20",
        condition: "Critical care",
        status: "critical"
      }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).status).toBe("critical");
  });

  it("PATCH /api/v1/pacientes/:id", async () => {
    const list = await app.inject({ method: "GET", url: "/api/v1/pacientes" });
    const id = JSON.parse(list.payload)[0].id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/pacientes/${id}`,
      payload: { status: "discharged" }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).status).toBe("discharged");
  });

  it("QUERY /api/v1/pacientes/query", async () => {
    const res = await app.inject({
      method: "QUERY",
      url: "/api/v1/pacientes/query",
      payload: { filters: { status: "discharged" } }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).data.length).toBeGreaterThanOrEqual(1);
  });

  it("DELETE /api/v1/pacientes/:id", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/pacientes",
      payload: {
        hospital_id: "11111111-1111-4111-8111-111111111111",
        doctor_id: null,
        first_name: "Nina",
        last_name: "Gil",
        birth_date: "1988-03-04",
        condition: "Stable",
        status: "stable"
      }
    });
    const id = JSON.parse(created.payload).id;

    const res = await app.inject({ method: "DELETE", url: `/api/v1/pacientes/${id}` });
    expect(res.statusCode).toBe(204);
  });

  it("returns 404 when paciente is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/pacientes/00000000-0000-4000-8000-000000000000"
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 on invalid paciente payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/pacientes",
      payload: {
        hospital_id: "bad",
        doctor_id: "bad",
        first_name: "",
        last_name: "",
        birth_date: "20-01-01",
        condition: "",
        status: "unknown"
      }
    });
    expect(res.statusCode).toBe(400);
  });
});
