export type Hospital = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  created_at: string;
  updated_at: string;
};

export type Doctor = {
  id: string;
  hospital_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Paciente = {
  id: string;
  hospital_id: string;
  doctor_id: string | null;
  first_name: string;
  last_name: string;
  birth_date: string;
  condition: string;
  status: "stable" | "critical" | "discharged";
  created_at: string;
  updated_at: string;
};

export type NewHospital = Omit<Hospital, "id" | "created_at" | "updated_at">;
export type UpdateHospital = Partial<NewHospital>;

export type NewDoctor = Omit<Doctor, "id" | "created_at" | "updated_at">;
export type UpdateDoctor = Partial<NewDoctor>;

export type NewPaciente = Omit<Paciente, "id" | "created_at" | "updated_at">;
export type UpdatePaciente = Partial<NewPaciente>;
