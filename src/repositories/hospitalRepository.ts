import { Pool } from "pg";
import { Hospital, NewHospital, UpdateHospital } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";

export type HospitalFilters = {
  name?: string;
  city?: string;
  phone?: string;
};

export class HospitalRepository {
  constructor(private readonly db: Pool) {}

  async list(): Promise<Hospital[]> {
    const result = await this.db.query(
      `SELECT * FROM hospital`
    );

    return result.rows;
  }

  async getById(id: string): Promise<Hospital | null> {
    const result = await this.db.query(
      `SELECT * FROM hospital WHERE id = $1`,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async create(payload: NewHospital): Promise<Hospital> {
    const result = await this.db.query(
      `INSERT INTO hospital (
        name,
        address,
        city,
        phone
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        payload.name,
        payload.address,
        payload.city,
        payload.phone
      ]
    );

    return result.rows[0];
  }
 
  async replace(
    id: string,
    payload: NewHospital
  ): Promise<Hospital | null> {
    const result = await this.db.query(
      `UPDATE hospital
       SET
         name = $1,
         address = $2,
         city = $3,
         phone = $4
       WHERE id = $5
       RETURNING *`,
      [
        payload.name,
        payload.address,
        payload.city,
        payload.phone,
        id
      ]
    );

    return result.rows[0] ?? null;
  }

  async patch(
    id: string,
    payload: UpdateHospital
  ): Promise<Hospital | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (payload.name !== undefined) {
      fields.push(`name = $${values.length + 1}`);
      values.push(payload.name);
    }

    if (payload.address !== undefined) {
      fields.push(`address = $${values.length + 1}`);
      values.push(payload.address);
    }

    if (payload.city !== undefined) {
      fields.push(`city = $${values.length + 1}`);
      values.push(payload.city);
    }

    if (payload.phone !== undefined) {
      fields.push(`phone = $${values.length + 1}`);
      values.push(payload.phone);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);

    const result = await this.db.query(
      `UPDATE hospital
       SET ${fields.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    return result.rows[0] ?? null;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM hospital
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  async query(payload: QueryPayload<HospitalFilters>): Promise<QueryResult<Hospital>> {
    const page = payload.page && payload.page > 0 ? payload.page : 1;
    const pageSize = payload.pageSize && payload.pageSize > 0 ? payload.pageSize : 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let request = this.db.from("hospital").select("*", { count: "exact" });

    if (payload.filters?.name) {
      request = request.ilike("name", `%${payload.filters.name}%`);
    }
    if (payload.filters?.city) {
      request = request.ilike("city", `%${payload.filters.city}%`);
    }
    if (payload.filters?.phone) {
      request = request.ilike("phone", `%${payload.filters.phone}%`);
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
