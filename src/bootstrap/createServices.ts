import pool from "../db/pool";
import { DoctorRepository } from "../repositories/doctorRepository";
import { HospitalRepository } from "../repositories/hospitalRepository";
import { PacienteRepository } from "../repositories/pacienteRepository";
import { DoctorService } from "../services/doctorService";
import { HospitalService } from "../services/hospitalService";
import { PacienteService } from "../services/pacienteService";
import { IDoctorService, IHospitalService, IPacienteService } from "../services/contracts";

export type ServiceContainer = {
  hospitalService: IHospitalService;
  doctorService: IDoctorService;
  pacienteService: IPacienteService;
};

export function createDefaultServices(): ServiceContainer {
  const hospitalRepository = new HospitalRepository(pool);
  const doctorRepository = new DoctorRepository(pool);
  const pacienteRepository = new PacienteRepository(pool);

  const hospitalService = new HospitalService(hospitalRepository);
  const doctorService = new DoctorService(doctorRepository, hospitalRepository);
  const pacienteService = new PacienteService(
    pacienteRepository,
    hospitalRepository,
    doctorRepository
  );

  return {
    hospitalService,
    doctorService,
    pacienteService
  };
}
