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

  async getLast(): Promise<Hospital | null> {
    const result = await this.db.query(
      `SELECT * FROM hospital ORDER BY created_at DESC, id DESC LIMIT 1`
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

  async query(
    payload: QueryPayload<HospitalFilters>
  ): Promise<QueryResult<Hospital>> {
    const page = payload.page && payload.page > 0
      ? payload.page
      : 1;

    const pageSize = payload.pageSize && payload.pageSize > 0
      ? payload.pageSize
      : 20;

    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (payload.filters?.name) {
      values.push(`%${payload.filters.name}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    if (payload.filters?.city) {
      values.push(`%${payload.filters.city}%`);
      conditions.push(`city ILIKE $${values.length}`);
    }

    if (payload.filters?.phone) {
      values.push(`%${payload.filters.phone}%`);
      conditions.push(`phone ILIKE $${values.length}`);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const allowedSortFields = [
      "id",
      "name",
      "address",
      "city",
      "phone",
      "created_at",
      "updated_at"
    ];

    const sortField = payload.sort?.field &&
      allowedSortFields.includes(payload.sort.field)
      ? payload.sort.field
      : "created_at";

    const sortDirection =
      payload.sort?.direction === "asc"
        ? "ASC"
        : "DESC";

    const dataValues = [...values, pageSize, offset];

    const dataResult = await this.db.query(
      `SELECT *
       FROM hospital
       ${whereClause}
       ORDER BY ${sortField} ${sortDirection}
       LIMIT $${dataValues.length - 1}
       OFFSET $${dataValues.length}`,
      dataValues
    );

    const countResult = await this.db.query(
      `SELECT COUNT(*)::int AS total
       FROM hospital
       ${whereClause}`,
      values
    );

    return {
      data: dataResult.rows,
      page,
      pageSize,
      total: countResult.rows[0]?.total ?? 0
    };
  }
}
