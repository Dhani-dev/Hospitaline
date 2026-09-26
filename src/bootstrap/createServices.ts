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
import { CachedExternalEntitiesClient } from "../integrations/cachedExternalEntitiesClient";
import { createCacheClient } from "../cache/createCacheClient";
import { EntityCache } from "../cache/entityCache";
import { CacheClient } from "../cache/cacheClient";

export type ServiceContainer = {
  hospitalService: IHospitalService;
  doctorService: IDoctorService;
  pacienteService: IPacienteService;
  cache?: CacheClient;
};

export function createDefaultServices(): ServiceContainer {
  const hospitalRepository = new HospitalRepository(pool);
  const doctorRepository = new DoctorRepository(pool);
  const pacienteRepository = new PacienteRepository(pool);
  const env = getEnvConfig();
  const cache = createCacheClient(env);
  const entityCache = new EntityCache(cache, env.cacheTtlSeconds);
  const externalEntitiesClient = new CachedExternalEntitiesClient(
    new HttpExternalEntitiesClient(
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
    ),
    cache,
    env.peerCacheTtlSeconds
  );

  const hospitalService = new HospitalService(
    hospitalRepository,
    externalEntitiesClient,
    entityCache
  );
  const doctorService = new DoctorService(
    doctorRepository,
    hospitalRepository,
    externalEntitiesClient,
    entityCache
  );
  const pacienteService = new PacienteService(
    pacienteRepository,
    hospitalRepository,
    doctorRepository,
    externalEntitiesClient,
    entityCache
  );

  return {
    hospitalService,
    doctorService,
    pacienteService,
    cache
  };
}
