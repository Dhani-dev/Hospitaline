import { HospitalRepository } from "../repositories/hospitalRepository";
import { NewHospital, UpdateHospital } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { Hospital, HospitalV2Response } from "../types/entities";
import { HospitalFilters } from "../repositories/hospitalRepository";
import { IHospitalService } from "./contracts";
import { ExternalEntitiesClient } from "../integrations/externalEntitiesClient";

export class HospitalService implements IHospitalService {
  constructor(
    private readonly hospitalRepository: HospitalRepository,
    private readonly externalEntitiesClient?: ExternalEntitiesClient
  ) {}

  list(): Promise<Hospital[]> {
    return this.hospitalRepository.list();
  }

  getById(id: string): Promise<Hospital | null> {
    return this.hospitalRepository.getById(id);
  }

  getLast(): Promise<Hospital | null> {
    return this.hospitalRepository.getLast();
  }

  async getByIdV2(id: string, traceId: string): Promise<HospitalV2Response | null> {
    const hospital = await this.hospitalRepository.getById(id);
    if (!hospital) {
      return null;
    }

    const peers = await Promise.all([
      this.getPeer("users", this.externalEntitiesClient?.getLastUser),
      this.getPeer("entrenador", this.externalEntitiesClient?.getLastEntrenador)
    ]);

    return {
      api: "hospitaline",
      version: "2.0.0",
      trace_id: traceId,
      entity: "hospital",
      local: hospital,
      peers: {
        "biblio-express": peers[0],
        pokenetes: peers[1]
      }
    };
  }

  private async getPeer(
    entity: "users" | "entrenador",
    loader?: () => Promise<Record<string, unknown>>
  ) {
    if (!loader) {
      return { live: false, entity, data: null };
    }

    try {
      return { live: true, entity, data: await loader() };
    } catch {
      return { live: false, entity, data: null };
    }
  }

  create(payload: NewHospital): Promise<Hospital> {
    return this.hospitalRepository.create(payload);
  }

  replace(id: string, payload: NewHospital): Promise<Hospital | null> {
    return this.hospitalRepository.replace(id, payload);
  }

  patch(id: string, payload: UpdateHospital): Promise<Hospital | null> {
    return this.hospitalRepository.patch(id, payload);
  }

  remove(id: string): Promise<boolean> {
    return this.hospitalRepository.remove(id);
  }

  query(payload: QueryPayload<HospitalFilters>): Promise<QueryResult<Hospital>> {
    return this.hospitalRepository.query(payload);
  }
}
