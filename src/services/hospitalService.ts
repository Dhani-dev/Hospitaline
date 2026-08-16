import { HospitalRepository } from "../repositories/hospitalRepository";
import { NewHospital, UpdateHospital } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { Hospital } from "../types/entities";
import { HospitalFilters } from "../repositories/hospitalRepository";
import { IHospitalService } from "./contracts";

export class HospitalService implements IHospitalService {
  constructor(private readonly hospitalRepository: HospitalRepository) {}

  list(): Promise<Hospital[]> {
    return this.hospitalRepository.list();
  }

  getById(id: string): Promise<Hospital | null> {
    return this.hospitalRepository.getById(id);
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
