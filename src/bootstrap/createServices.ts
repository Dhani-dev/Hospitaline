import { createSupabaseClient } from "../db/supabaseClient";
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
  const db = createSupabaseClient();

  const hospitalRepository = new HospitalRepository(db);
  const doctorRepository = new DoctorRepository(db);
  const pacienteRepository = new PacienteRepository(db);

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
