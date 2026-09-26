import { HospitalRepository } from "../repositories/hospitalRepository";
import { NewHospital, UpdateHospital } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { Hospital } from "../types/entities";
import { HospitalDetails } from "../types/entities";
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

  async getById(id: string): Promise<HospitalDetails | null> {
    const hospital = await this.hospitalRepository.getById(id);
    if (!hospital || !this.externalEntitiesClient) {
      return hospital as HospitalDetails | null;
    }

    const [user, entrenador] = await Promise.all([
      this.externalEntitiesClient.getUserById(id),
      this.externalEntitiesClient.getEntrenadorById(id)
    ]);

    return { ...hospital, user, entrenador };
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
