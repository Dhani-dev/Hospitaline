import { DoctorRepository } from "../repositories/doctorRepository";
import { HospitalRepository } from "../repositories/hospitalRepository";
import { PacienteRepository, PacienteFilters } from "../repositories/pacienteRepository";
import { HttpError } from "../errors/httpError";
import { NewPaciente, Paciente, UpdatePaciente } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { IPacienteService } from "./contracts";

export class PacienteService implements IPacienteService {
  constructor(
    private readonly pacienteRepository: PacienteRepository,
    private readonly hospitalRepository: HospitalRepository,
    private readonly doctorRepository: DoctorRepository
  ) {}

  list(): Promise<Paciente[]> {
    return this.pacienteRepository.list();
  }

  getById(id: string): Promise<Paciente | null> {
    return this.pacienteRepository.getById(id);
  }

  async create(payload: NewPaciente): Promise<Paciente> {
    await this.assertHospital(payload.hospital_id);
    await this.assertDoctor(payload.doctor_id, payload.hospital_id);

    return this.pacienteRepository.create(payload);
  }

  async replace(id: string, payload: NewPaciente): Promise<Paciente | null> {
    await this.assertHospital(payload.hospital_id);
    await this.assertDoctor(payload.doctor_id, payload.hospital_id);

    return this.pacienteRepository.replace(id, payload);
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

    return this.pacienteRepository.patch(id, payload);
  }

  remove(id: string): Promise<boolean> {
    return this.pacienteRepository.remove(id);
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
}
