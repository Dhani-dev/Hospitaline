import { HospitalRepository } from "../repositories/hospitalRepository";
import { NewHospital, UpdateHospital } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { Hospital, HospitalV2Response } from "../types/entities";
import { HospitalFilters } from "../repositories/hospitalRepository";
import { IHospitalService } from "./contracts";
import { ExternalEntitiesClient } from "../integrations/externalEntitiesClient";
import { buildEntityV2Response } from "../integrations/v2Response";
import { EntityCache } from "../cache/entityCache";
import { cacheKeys } from "../cache/keys";

export class HospitalService implements IHospitalService {
  constructor(
    private readonly hospitalRepository: HospitalRepository,
    private readonly externalEntitiesClient?: ExternalEntitiesClient,
    private readonly entityCache?: EntityCache
  ) {}

  list(): Promise<Hospital[]> {
    return this.hospitalRepository.list();
  }

  getById(id: string): Promise<Hospital | null> {
    return this.readThrough(cacheKeys.local("hospital", id), () =>
      this.hospitalRepository.getById(id)
    );
  }

  getLast(): Promise<Hospital | null> {
    return this.readThrough(cacheKeys.last("hospital"), () =>
      this.hospitalRepository.getLast()
    );
  }

  async getByIdV2(id: string, traceId: string): Promise<HospitalV2Response | null> {
    const hospital = await this.getById(id);
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

  async create(payload: NewHospital): Promise<Hospital> {
    const created = await this.hospitalRepository.create(payload);
    await this.entityCache?.invalidateLocal("hospital");
    return created;
  }

  async replace(id: string, payload: NewHospital): Promise<Hospital | null> {
    const updated = await this.hospitalRepository.replace(id, payload);
    await this.entityCache?.invalidateLocal("hospital", id);
    return updated;
  }

  async patch(id: string, payload: UpdateHospital): Promise<Hospital | null> {
    const updated = await this.hospitalRepository.patch(id, payload);
    await this.entityCache?.invalidateLocal("hospital", id);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.hospitalRepository.remove(id);
    await this.entityCache?.invalidateLocal("hospital", id);
    return removed;
  }

  query(payload: QueryPayload<HospitalFilters>): Promise<QueryResult<Hospital>> {
    return this.hospitalRepository.query(payload);
  }

  private readThrough<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (!this.entityCache) {
      return loader();
    }

    return this.entityCache.readThrough(key, loader);
  }
}
