import { DbClient } from "../db/supabaseClient";
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
  constructor(private readonly db: DbClient) {}

  async list(): Promise<Doctor[]> {
    const { data, error } = await this.db.from("doctors").select("*");
    if (error) throw error;
    return data ?? [];
  }

  async getById(id: string): Promise<Doctor | null> {
    const { data, error } = await this.db
      .from("doctors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(payload: NewDoctor): Promise<Doctor> {
    const { data, error } = await this.db
      .from("doctors")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async replace(id: string, payload: NewDoctor): Promise<Doctor | null> {
    const { data, error } = await this.db
      .from("doctors")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async patch(id: string, payload: UpdateDoctor): Promise<Doctor | null> {
    const { data, error } = await this.db
      .from("doctors")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async remove(id: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("doctors")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  async query(payload: QueryPayload<DoctorFilters>): Promise<QueryResult<Doctor>> {
    const page = payload.page && payload.page > 0 ? payload.page : 1;
    const pageSize = payload.pageSize && payload.pageSize > 0 ? payload.pageSize : 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let request = this.db.from("doctors").select("*", { count: "exact" });

    if (payload.filters?.hospital_id) {
      request = request.eq("hospital_id", payload.filters.hospital_id);
    }
    if (payload.filters?.first_name) {
      request = request.ilike("first_name", `%${payload.filters.first_name}%`);
    }
    if (payload.filters?.last_name) {
      request = request.ilike("last_name", `%${payload.filters.last_name}%`);
    }
    if (payload.filters?.specialty) {
      request = request.ilike("specialty", `%${payload.filters.specialty}%`);
    }
    if (payload.filters?.email) {
      request = request.ilike("email", `%${payload.filters.email}%`);
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
