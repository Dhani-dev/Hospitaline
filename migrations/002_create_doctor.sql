create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  specialty text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_doctors_updated_at
before update on public.doctors
for each row execute procedure public.set_timestamp();
