create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  clinic_name text,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  age integer not null,
  gender text not null default 'Other',
  contact text not null default '',
  history text not null default '',
  symptoms jsonb not null default '[]'::jsonb,
  vitals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.patients to authenticated;
grant all on public.patients to service_role;

alter table public.patients enable row level security;

create policy "patients_select_own" on public.patients for select using (auth.uid() = user_id);
create policy "patients_insert_own" on public.patients for insert with check (auth.uid() = user_id);
create policy "patients_update_own" on public.patients for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "patients_delete_own" on public.patients for delete using (auth.uid() = user_id);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id uuid not null,
  disease text not null,
  risk text not null,
  confidence integer not null,
  created_at timestamptz not null default now()
);

grant select, insert, delete on public.predictions to authenticated;
grant all on public.predictions to service_role;

alter table public.predictions enable row level security;

create policy "predictions_select_own" on public.predictions for select using (auth.uid() = user_id);
create policy "predictions_insert_own" on public.predictions for insert with check (auth.uid() = user_id);
create policy "predictions_delete_own" on public.predictions for delete using (auth.uid() = user_id);

create index patients_user_idx on public.patients (user_id, created_at desc);
create index predictions_patient_idx on public.predictions (patient_id, created_at desc);