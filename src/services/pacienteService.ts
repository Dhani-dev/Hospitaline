import { DoctorRepository } from "../repositories/doctorRepository";
import { HospitalRepository } from "../repositories/hospitalRepository";
import { PacienteRepository, PacienteFilters } from "../repositories/pacienteRepository";
import { HttpError } from "../errors/httpError";
import { NewPaciente, Paciente, PacienteV2Response, UpdatePaciente } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { IPacienteService } from "./contracts";
import { ExternalEntitiesClient } from "../integrations/externalEntitiesClient";
import { buildEntityV2Response } from "../integrations/v2Response";
import { EntityCache } from "../cache/entityCache";
import { cacheKeys } from "../cache/keys";

export class PacienteService implements IPacienteService {
  constructor(
    private readonly pacienteRepository: PacienteRepository,
    private readonly hospitalRepository: HospitalRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly externalEntitiesClient?: ExternalEntitiesClient,
    private readonly entityCache?: EntityCache
  ) {}

  list(): Promise<Paciente[]> {
    return this.pacienteRepository.list();
  }

  getById(id: string): Promise<Paciente | null> {
    return this.readThrough(cacheKeys.local("paciente", id), () =>
      this.pacienteRepository.getById(id)
    );
  }

  getLast(): Promise<Paciente | null> {
    return this.readThrough(cacheKeys.last("paciente"), () =>
      this.pacienteRepository.getLast()
    );
  }

  async getByIdV2(id: string, traceId: string): Promise<PacienteV2Response | null> {
    const paciente = await this.getById(id);
    if (!paciente) {
      return null;
    }

    return buildEntityV2Response(
      "paciente",
      paciente,
      traceId,
      this.externalEntitiesClient
    );
  }

  async create(payload: NewPaciente): Promise<Paciente> {
    await this.assertHospital(payload.hospital_id);
    await this.assertDoctor(payload.doctor_id, payload.hospital_id);
    const created = await this.pacienteRepository.create(payload);
    await this.entityCache?.invalidateLocal("paciente");
    return created;
  }

  async replace(id: string, payload: NewPaciente): Promise<Paciente | null> {
    await this.assertHospital(payload.hospital_id);
    await this.assertDoctor(payload.doctor_id, payload.hospital_id);
    const updated = await this.pacienteRepository.replace(id, payload);
    await this.entityCache?.invalidateLocal("paciente", id);
    return updated;
  }

  async patch(id: string, payload: UpdatePaciente): Promise<Paciente | null> {
    const current = await this.pacienteRepository.getById(id);
    if (!current) {
      return null;
    }

    const hospitalId = payload.hospital_id ?? current.hospital_id;
    const doctorId = payload.doctor_id === undefined ? current.doctor_id : payload.doctor_id;

    await this.assertHospital(hospitalId);
    await this.assertDoctor(doctorId, hospitalId);

    const updated = await this.pacienteRepository.patch(id, payload);
    await this.entityCache?.invalidateLocal("paciente", id);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.pacienteRepository.remove(id);
    await this.entityCache?.invalidateLocal("paciente", id);
    return removed;
  }

  query(payload: QueryPayload<PacienteFilters>): Promise<QueryResult<Paciente>> {
    return this.pacienteRepository.query(payload);
  }

  private async assertHospital(hospitalId: string): Promise<void> {
    const hospital = await this.hospitalRepository.getById(hospitalId);
    if (!hospital) {
      throw new HttpError(400, "Hospital does not exist");
    }
  }

  private async assertDoctor(doctorId: string | null, hospitalId: string): Promise<void> {
    if (!doctorId) {
      return;
    }

    const doctor = await this.doctorRepository.getById(doctorId);
    if (!doctor) {
      throw new HttpError(400, "Doctor does not exist");
    }

    if (doctor.hospital_id !== hospitalId) {
      throw new HttpError(400, "Doctor must belong to the same hospital");
    }
  }

  private readThrough<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (!this.entityCache) {
      return loader();
    }

    return this.entityCache.readThrough(key, loader);
  }
}
