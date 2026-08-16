import { DbClient } from "../db/supabaseClient";
import { Hospital, NewHospital, UpdateHospital } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";

export type HospitalFilters = {
  name?: string;
  city?: string;
  phone?: string;
};

export class HospitalRepository {
  constructor(private readonly db: DbClient) {}

  async list(): Promise<Hospital[]> {
    const { data, error } = await this.db.from("hospitals").select("*");
    if (error) throw error;
    return data ?? [];
  }

  async getById(id: string): Promise<Hospital | null> {
    const { data, error } = await this.db
      .from("hospitals")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(payload: NewHospital): Promise<Hospital> {
    const { data, error } = await this.db
      .from("hospitals")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async replace(id: string, payload: NewHospital): Promise<Hospital | null> {
    const { data, error } = await this.db
      .from("hospitals")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async patch(id: string, payload: UpdateHospital): Promise<Hospital | null> {
    const { data, error } = await this.db
      .from("hospitals")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async remove(id: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("hospitals")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  async query(payload: QueryPayload<HospitalFilters>): Promise<QueryResult<Hospital>> {
    const page = payload.page && payload.page > 0 ? payload.page : 1;
    const pageSize = payload.pageSize && payload.pageSize > 0 ? payload.pageSize : 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let request = this.db.from("hospitals").select("*", { count: "exact" });

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
