import { HospitalRepository } from "../repositories/hospitalRepository";
import { DoctorRepository, DoctorFilters } from "../repositories/doctorRepository";
import { NewDoctor, Doctor, DoctorV2Response, UpdateDoctor } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { HttpError } from "../errors/httpError";
import { IDoctorService } from "./contracts";
import { ExternalEntitiesClient } from "../integrations/externalEntitiesClient";
import { buildEntityV2Response } from "../integrations/v2Response";

export class DoctorService implements IDoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly hospitalRepository: HospitalRepository,
    private readonly externalEntitiesClient?: ExternalEntitiesClient
  ) {}

  list(): Promise<Doctor[]> {
    return this.doctorRepository.list();
  }

  getById(id: string): Promise<Doctor | null> {
    return this.doctorRepository.getById(id);
  }

  getLast(): Promise<Doctor | null> {
    return this.doctorRepository.getLast();
  }

  async getByIdV2(id: string, traceId: string): Promise<DoctorV2Response | null> {
    const doctor = await this.doctorRepository.getById(id);
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
    return this.doctorRepository.create(payload);
  }

  async replace(id: string, payload: NewDoctor): Promise<Doctor | null> {
    const hospital = await this.hospitalRepository.getById(payload.hospital_id);
    if (!hospital) {
      throw new HttpError(400, "Hospital does not exist");
    }
    return this.doctorRepository.replace(id, payload);
  }

  async patch(id: string, payload: UpdateDoctor): Promise<Doctor | null> {
    if (payload.hospital_id) {
      const hospital = await this.hospitalRepository.getById(payload.hospital_id);
      if (!hospital) {
        throw new HttpError(400, "Hospital does not exist");
      }
    }
    return this.doctorRepository.patch(id, payload);
  }

  remove(id: string): Promise<boolean> {
    return this.doctorRepository.remove(id);
  }

  query(payload: QueryPayload<DoctorFilters>): Promise<QueryResult<Doctor>> {
    return this.doctorRepository.query(payload);
  }
}
