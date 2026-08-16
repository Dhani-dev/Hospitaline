create extension if not exists "pgcrypto";

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_hospitals_updated_at
before update on public.hospitals
for each row execute procedure public.set_timestamp();
