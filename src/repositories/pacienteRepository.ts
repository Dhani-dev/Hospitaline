import { DbClient } from "../db/supabaseClient";
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
  constructor(private readonly db: DbClient) {}

  async list(): Promise<Paciente[]> {
    const { data, error } = await this.db.from("paciente").select("*");
    if (error) throw error;
    return data ?? [];
  }

  async getById(id: string): Promise<Paciente | null> {
    const { data, error } = await this.db
      .from("paciente")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(payload: NewPaciente): Promise<Paciente> {
    const { data, error } = await this.db
      .from("paciente")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async replace(id: string, payload: NewPaciente): Promise<Paciente | null> {
    const { data, error } = await this.db
      .from("paciente")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async patch(id: string, payload: UpdatePaciente): Promise<Paciente | null> {
    const { data, error } = await this.db
      .from("paciente")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
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
