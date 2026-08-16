import { NewDoctor, NewHospital, NewPaciente, UpdateDoctor, UpdateHospital, UpdatePaciente } from "../types/entities";
import { QueryPayload, QueryResult } from "../types/query";
import { DoctorFilters } from "../repositories/doctorRepository";
import { HospitalFilters } from "../repositories/hospitalRepository";
import { PacienteFilters } from "../repositories/pacienteRepository";
import { Doctor, Hospital, Paciente } from "../types/entities";

export interface IHospitalService {
  list(): Promise<Hospital[]>;
  getById(id: string): Promise<Hospital | null>;
  create(payload: NewHospital): Promise<Hospital>;
  replace(id: string, payload: NewHospital): Promise<Hospital | null>;
  patch(id: string, payload: UpdateHospital): Promise<Hospital | null>;
  remove(id: string): Promise<boolean>;
  query(payload: QueryPayload<HospitalFilters>): Promise<QueryResult<Hospital>>;
}

export interface IDoctorService {
  list(): Promise<Doctor[]>;
  getById(id: string): Promise<Doctor | null>;
  create(payload: NewDoctor): Promise<Doctor>;
  replace(id: string, payload: NewDoctor): Promise<Doctor | null>;
  patch(id: string, payload: UpdateDoctor): Promise<Doctor | null>;
  remove(id: string): Promise<boolean>;
  query(payload: QueryPayload<DoctorFilters>): Promise<QueryResult<Doctor>>;
}

export interface IPacienteService {
  list(): Promise<Paciente[]>;
  getById(id: string): Promise<Paciente | null>;
  create(payload: NewPaciente): Promise<Paciente>;
  replace(id: string, payload: NewPaciente): Promise<Paciente | null>;
  patch(id: string, payload: UpdatePaciente): Promise<Paciente | null>;
  remove(id: string): Promise<boolean>;
  query(payload: QueryPayload<PacienteFilters>): Promise<QueryResult<Paciente>>;
}
