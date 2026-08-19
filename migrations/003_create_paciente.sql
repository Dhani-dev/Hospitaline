create table if not exists public.paciente (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospital(id) on delete cascade,
  doctor_id uuid references public.doctor(id) on delete set null,
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  condition text not null,
  status text not null check (status in ('stable', 'critical', 'discharged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_paciente_updated_at
before update on public.paciente
for each row execute procedure public.set_timestamp();
