import { HospitalRepository } from "../repositories/hospitalRepository";
import { NewHospital, UpdateHospital } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { Hospital, HospitalV2Response } from "../types/entities";
import { HospitalFilters } from "../repositories/hospitalRepository";
import { IHospitalService } from "./contracts";
import { ExternalEntitiesClient } from "../integrations/externalEntitiesClient";
import { buildEntityV2Response } from "../integrations/v2Response";

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

    return buildEntityV2Response(
      "hospital",
      hospital,
      traceId,
      this.externalEntitiesClient
    );
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
