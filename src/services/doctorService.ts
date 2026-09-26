import { HospitalRepository } from "../repositories/hospitalRepository";
import { DoctorRepository, DoctorFilters } from "../repositories/doctorRepository";
import { NewDoctor, Doctor, DoctorV2Response, UpdateDoctor } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { HttpError } from "../errors/httpError";
import { IDoctorService } from "./contracts";
import { ExternalEntitiesClient } from "../integrations/externalEntitiesClient";
import { buildEntityV2Response } from "../integrations/v2Response";
import { EntityCache } from "../cache/entityCache";
import { cacheKeys } from "../cache/keys";

export class DoctorService implements IDoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly hospitalRepository: HospitalRepository,
    private readonly externalEntitiesClient?: ExternalEntitiesClient,
    private readonly entityCache?: EntityCache
  ) {}

  list(): Promise<Doctor[]> {
    return this.doctorRepository.list();
  }

  getById(id: string): Promise<Doctor | null> {
    return this.readThrough(cacheKeys.local("doctor", id), () =>
      this.doctorRepository.getById(id)
    );
  }

  getLast(): Promise<Doctor | null> {
    return this.readThrough(cacheKeys.last("doctor"), () =>
      this.doctorRepository.getLast()
    );
  }

  async getByIdV2(id: string, traceId: string): Promise<DoctorV2Response | null> {
    const doctor = await this.getById(id);
    if (!doctor) {
      return null;
    }

    return buildEntityV2Response(
      "doctor",
      doctor,
      traceId,
      this.externalEntitiesClient
    );
  }

  async create(payload: NewDoctor): Promise<Doctor> {
    const hospital = await this.hospitalRepository.getById(payload.hospital_id);
    if (!hospital) {
      throw new HttpError(400, "Hospital does not exist");
    }
    const created = await this.doctorRepository.create(payload);
    await this.entityCache?.invalidateLocal("doctor");
    return created;
  }

  async replace(id: string, payload: NewDoctor): Promise<Doctor | null> {
    const hospital = await this.hospitalRepository.getById(payload.hospital_id);
    if (!hospital) {
      throw new HttpError(400, "Hospital does not exist");
    }
    const updated = await this.doctorRepository.replace(id, payload);
    await this.entityCache?.invalidateLocal("doctor", id);
    return updated;
  }

  async patch(id: string, payload: UpdateDoctor): Promise<Doctor | null> {
    if (payload.hospital_id) {
      const hospital = await this.hospitalRepository.getById(payload.hospital_id);
      if (!hospital) {
        throw new HttpError(400, "Hospital does not exist");
      }
    }
    const updated = await this.doctorRepository.patch(id, payload);
    await this.entityCache?.invalidateLocal("doctor", id);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.doctorRepository.remove(id);
    await this.entityCache?.invalidateLocal("doctor", id);
    return removed;
  }

  query(payload: QueryPayload<DoctorFilters>): Promise<QueryResult<Doctor>> {
    return this.doctorRepository.query(payload);
  }

  private readThrough<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (!this.entityCache) {
      return loader();
    }

    return this.entityCache.readThrough(key, loader);
  }
}
