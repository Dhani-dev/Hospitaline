import pool from "../db/pool";
import { DoctorRepository } from "../repositories/doctorRepository";
import { HospitalRepository } from "../repositories/hospitalRepository";
import { PacienteRepository } from "../repositories/pacienteRepository";
import { DoctorService } from "../services/doctorService";
import { HospitalService } from "../services/hospitalService";
import { PacienteService } from "../services/pacienteService";
import { IDoctorService, IHospitalService, IPacienteService } from "../services/contracts";
import { getEnvConfig } from "../config/env";
import { HttpExternalEntitiesClient } from "../integrations/externalEntitiesClient";

export type ServiceContainer = {
  hospitalService: IHospitalService;
  doctorService: IDoctorService;
  pacienteService: IPacienteService;
};

export function createDefaultServices(): ServiceContainer {
  const hospitalRepository = new HospitalRepository(pool);
  const doctorRepository = new DoctorRepository(pool);
  const pacienteRepository = new PacienteRepository(pool);
  const env = getEnvConfig();
  const externalEntitiesClient = new HttpExternalEntitiesClient(
    {
      baseUrl: env.usersApiUrl,
      lastPath: env.usersLastPath,
      listPath: env.usersListPath
    },
    {
      baseUrl: env.entrenadorApiUrl,
      lastPath: env.entrenadorLastPath,
      listPath: env.entrenadorListPath
    }
  );

  const hospitalService = new HospitalService(
    hospitalRepository,
    externalEntitiesClient
  );
  const doctorService = new DoctorService(
    doctorRepository,
    hospitalRepository,
    externalEntitiesClient
  );
  const pacienteService = new PacienteService(
    pacienteRepository,
    hospitalRepository,
    doctorRepository,
    externalEntitiesClient
  );

  return {
    hospitalService,
    doctorService,
    pacienteService
  };
}
