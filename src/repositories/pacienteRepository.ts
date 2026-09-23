import { Pool } from "pg";
import { NewPaciente, Paciente, UpdatePaciente } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";

export type PacienteFilters = {
  hospital_id?: string;
  doctor_id?: string | null;
  first_name?: string;
  last_name?: string;
  status?: "stable" | "critical" | "discharged";
  condition?: string;
};

export class PacienteRepository {
  constructor(private readonly db: Pool) {}

  async list(): Promise<Paciente[]> {
    const result = await this.db.query(
      `SELECT * FROM paciente`
    );
    return result.rows;
  }

  async getById(id: string): Promise<Paciente | null> {
    const result = await this.db.query(
      `SELECT * FROM paciente WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async create(payload: NewPaciente): Promise<Paciente> {
    const result = await this.db.query(
      `INSERT INTO paciente (
        hospital_id,
        doctor_id,
        first_name,
        last_name,
        birth_date,
        condition,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        payload.hospital_id,
        payload.doctor_id,
        payload.first_name,
        payload.last_name,
        payload.birth_date,
        payload.condition,
        payload.status
      ]
    );
    return result.rows[0];
  }

  async replace(
    id: string,
    payload: NewPaciente
  ): Promise<Paciente | null> {
    const result = await this.db.query(
      `UPDATE paciente
       SET
         hospital_id = $1,
         doctor_id = $2,
         first_name = $3,
         last_name = $4,
         birth_date = $5,
         condition = $6,
         status = $7
       WHERE id = $8
       RETURNING *`,
      [
        payload.hospital_id,
        payload.doctor_id,
        payload.first_name,
        payload.last_name,
        payload.birth_date,
        payload.condition,
        payload.status,
        id
      ]
    );
    return result.rows[0] ?? null;
  }

  async patch(
    id: string,
    payload: UpdatePaciente
  ): Promise<Paciente | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (payload.hospital_id !== undefined) {
      fields.push(`hospital_id = $${values.length + 1}`);
      values.push(payload.hospital_id);
    }

    if (payload.doctor_id !== undefined) {
      fields.push(`doctor_id = $${values.length + 1}`);
      values.push(payload.doctor_id);
    }

    if (payload.first_name !== undefined) {
      fields.push(`first_name = $${values.length + 1}`);
      values.push(payload.first_name);
    }

    if (payload.last_name !== undefined) {
      fields.push(`last_name = $${values.length + 1}`);
      values.push(payload.last_name);
    }

    if (payload.birth_date !== undefined) {
      fields.push(`birth_date = $${values.length + 1}`);
      values.push(payload.birth_date);
    }

    if (payload.condition !== undefined) {
      fields.push(`condition = $${values.length + 1}`);
      values.push(payload.condition);
    }

    if (payload.status !== undefined) {
      fields.push(`status = $${values.length + 1}`);
      values.push(payload.status);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);

    const result = await this.db.query(
      `UPDATE paciente
       SET ${fields.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    return result.rows[0] ?? null;
  }

  async remove(id: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("paciente")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  async query(payload: QueryPayload<PacienteFilters>): Promise<QueryResult<Paciente>> {
    const page = payload.page && payload.page > 0 ? payload.page : 1;
    const pageSize = payload.pageSize && payload.pageSize > 0 ? payload.pageSize : 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let request = this.db.from("paciente").select("*", { count: "exact" });

    if (payload.filters?.hospital_id) {
      request = request.eq("hospital_id", payload.filters.hospital_id);
    }
    if (payload.filters?.doctor_id) {
      request = request.eq("doctor_id", payload.filters.doctor_id);
    }
    if (payload.filters?.first_name) {
      request = request.ilike("first_name", `%${payload.filters.first_name}%`);
    }
    if (payload.filters?.last_name) {
      request = request.ilike("last_name", `%${payload.filters.last_name}%`);
    }
    if (payload.filters?.status) {
      request = request.eq("status", payload.filters.status);
    }
    if (payload.filters?.condition) {
      request = request.ilike("condition", `%${payload.filters.condition}%`);
    }

    if (payload.sort?.field) {
      request = request.order(payload.sort.field, {
        ascending: payload.sort.direction !== "desc"
      });
    } else {
      request = request.order("created_at", { ascending: false });
    }

    const { data, count, error } = await request.range(from, to);

    if (error) throw error;

    return {
      data: data ?? [],
      page,
      pageSize,
      total: count ?? 0
    };
  }
}
