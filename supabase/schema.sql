-- GIANT 40th Anniversary & Christmas Celebration – inschrijvingen
-- Uitvoeren in Supabase → SQL Editor. Kan veilig opnieuw worden uitgevoerd:
-- werkt op een leeg project én werkt een bestaande database bij naar de nieuwste versie.

create extension if not exists pgcrypto;

-- ── Afdelingen (suggesties in het invulveld) ────────────────────────────────
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Afdelingsnamen mogen langer zijn dan alleen een code (bv. "Customer Service").
alter table public.departments drop constraint if exists departments_code_check;
alter table public.departments add constraint departments_code_check
  check (char_length(trim(code)) between 1 and 80);

insert into public.departments (code, sort_order) values
  ('GEM', 1),
  ('GE', 2),
  ('GEHQ', 3)
on conflict (code) do nothing;

-- ── Inschrijvingen ─────────────────────────────────────────────────────────
create table if not exists public.registrations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 2 and 120),
  department  text,
  created_at  timestamptz not null default now()
);

-- Bijwerken vanaf de eerste versie (afdeling als keuzelijst → afdeling als vrije tekst).
alter table public.registrations add column if not exists department text;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'registrations' and column_name = 'department_id'
  ) then
    update public.registrations r
       set department = d.code
      from public.departments d
     where d.id = r.department_id and r.department is null;
    drop policy if exists registrations_public_insert on public.registrations;
    drop index if exists public.registrations_unique_name_per_dept;
    alter table public.registrations drop column department_id;
  end if;
end $$;

alter table public.registrations alter column department set not null;
alter table public.registrations drop constraint if exists registrations_department_check;
alter table public.registrations add constraint registrations_department_check
  check (char_length(trim(department)) between 1 and 80);

-- Dezelfde naam kan zich niet twee keer bij dezelfde afdeling inschrijven (hoofdletterongevoelig).
create unique index if not exists registrations_unique_name_per_department
  on public.registrations (lower(trim(name)), lower(trim(department)));

-- ── Beheerders ─────────────────────────────────────────────────────────────
-- Wie hier staat (op e-mailadres) mag in /admin de lijst zien en afdelingen beheren.
-- Het account zelf maak je aan in Supabase → Authentication → Users → Add user.
create table if not exists public.admins (
  email text primary key
);

-- insert into public.admins (email) values ('naam@giant-europe.com');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.departments   enable row level security;
alter table public.registrations enable row level security;
alter table public.admins        enable row level security;

-- Afdelingen: iedereen ziet de actieve; beheerders zien en beheren alles.
drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments
  for select to anon, authenticated
  using (active or public.is_admin());

drop policy if exists departments_admin_insert on public.departments;
create policy departments_admin_insert on public.departments
  for insert to authenticated with check (public.is_admin());
drop policy if exists departments_admin_update on public.departments;
create policy departments_admin_update on public.departments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists departments_admin_delete on public.departments;
create policy departments_admin_delete on public.departments
  for delete to authenticated using (public.is_admin());

-- Inschrijvingen: iedereen mag zich inschrijven, maar alleen beheerders mogen de lijst lezen of wissen.
drop policy if exists registrations_public_insert on public.registrations;
create policy registrations_public_insert on public.registrations
  for insert to anon, authenticated
  with check (char_length(trim(name)) >= 2 and char_length(trim(department)) >= 1);

drop policy if exists registrations_admin_select on public.registrations;
create policy registrations_admin_select on public.registrations
  for select to authenticated using (public.is_admin());
drop policy if exists registrations_admin_delete on public.registrations;
create policy registrations_admin_delete on public.registrations
  for delete to authenticated using (public.is_admin());

-- Beheerders: alleen een beheerder kan de lijst zien; wijzigen alleen via de SQL Editor.
drop policy if exists admins_read on public.admins;
create policy admins_read on public.admins
  for select to authenticated using (public.is_admin());

-- ── Rechten voor de Supabase API ───────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select on public.departments to anon, authenticated;
grant insert, update, delete on public.departments to authenticated;
grant insert on public.registrations to anon, authenticated;
grant select, delete on public.registrations to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
