import { Pool } from "pg";
import { Doctor, NewDoctor, UpdateDoctor } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";

export type DoctorFilters = {
  hospital_id?: string;
  first_name?: string;
  last_name?: string;
  specialty?: string;
  email?: string;
};

export class DoctorRepository {
  constructor(private readonly db: Pool) {}

  async list(): Promise<Doctor[]> {
    const result = await this.db.query(
      `SELECT * FROM doctor`
    );
    return result.rows;
  }

  async getById(id: string): Promise<Doctor | null> {
    const result = await this.db.query(
      `SELECT * FROM doctor WHERE id = $1`,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async getLast(): Promise<Doctor | null> {
    const result = await this.db.query(
      `SELECT * FROM doctor ORDER BY created_at DESC, id DESC LIMIT 1`
    );

    return result.rows[0] ?? null;
  }

  async create(payload: NewDoctor): Promise<Doctor> {
    const result = await this.db.query(
      `INSERT INTO doctor (
        hospital_id,
        first_name,
        last_name,
        specialty,
        email
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        payload.hospital_id,
        payload.first_name,
        payload.last_name,
        payload.specialty,
        payload.email
      ]
    );
    return result.rows[0];
  }

  async replace(
    id: string,
    payload: NewDoctor
  ): Promise<Doctor | null> {
    const result = await this.db.query(
      `UPDATE doctor
       SET
         hospital_id = $1,
         first_name = $2,
         last_name = $3,
         specialty = $4,
         email = $5
       WHERE id = $6
       RETURNING *`,
      [
        payload.hospital_id,
        payload.first_name,
        payload.last_name,
        payload.specialty,
        payload.email,
        id
      ]
    );
    return result.rows[0] ?? null;
  }

  async patch(
    id: string,
    payload: UpdateDoctor
  ): Promise<Doctor | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (payload.hospital_id !== undefined) {
      fields.push(`hospital_id = $${values.length + 1}`);
      values.push(payload.hospital_id);
    }

    if (payload.first_name !== undefined) {
      fields.push(`first_name = $${values.length + 1}`);
      values.push(payload.first_name);
    }

    if (payload.last_name !== undefined) {
      fields.push(`last_name = $${values.length + 1}`);
      values.push(payload.last_name);
    }

    if (payload.specialty !== undefined) {
      fields.push(`specialty = $${values.length + 1}`);
      values.push(payload.specialty);
    }

    if (payload.email !== undefined) {
      fields.push(`email = $${values.length + 1}`);
      values.push(payload.email);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);

    const result = await this.db.query(
      `UPDATE doctor
       SET ${fields.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM doctor
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async query(
    payload: QueryPayload<DoctorFilters>
  ): Promise<QueryResult<Doctor>> {
    const page = payload.page && payload.page > 0
      ? payload.page
      : 1;

    const pageSize = payload.pageSize && payload.pageSize > 0
      ? payload.pageSize
      : 20;

    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (payload.filters?.hospital_id) {
      values.push(payload.filters.hospital_id);
      conditions.push(`hospital_id = $${values.length}`);
    }

    if (payload.filters?.first_name) {
      values.push(`%${payload.filters.first_name}%`);
      conditions.push(`first_name ILIKE $${values.length}`);
    }

    if (payload.filters?.last_name) {
      values.push(`%${payload.filters.last_name}%`);
      conditions.push(`last_name ILIKE $${values.length}`);
    }

    if (payload.filters?.specialty) {
      values.push(`%${payload.filters.specialty}%`);
      conditions.push(`specialty ILIKE $${values.length}`);
    }

    if (payload.filters?.email) {
      values.push(`%${payload.filters.email}%`);
      conditions.push(`email ILIKE $${values.length}`);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const allowedSortFields = [
      "id",
      "hospital_id",
      "first_name",
      "last_name",
      "specialty",
      "email",
      "created_at",
      "updated_at"
    ];

    const sortField =
      payload.sort?.field &&
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
       FROM doctor
       ${whereClause}
       ORDER BY ${sortField} ${sortDirection}
       LIMIT $${dataValues.length - 1}
       OFFSET $${dataValues.length}`,
      dataValues
    );

    const countResult = await this.db.query(
      `SELECT COUNT(*)::int AS total
       FROM doctor
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
