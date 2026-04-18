-- Cloak initial schema (Supabase/Postgres)

create table if not exists public.profiles (
  user_id uuid primary key,
  nickname text not null default 'Detetive Sem Nome',
  character_id text not null default 'noir',
  points integer not null default 0,
  deduction integer not null default 1,
  charisma integer not null default 1,
  forensics integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_cases (
  user_id uuid not null,
  case_id text not null,
  title text not null,
  sender text not null,
  status text not null check (status in ('invite', 'active', 'closed')),
  suspect text not null default 'Desconhecido',
  locations text[] not null default '{}',
  clue_schedule_hours integer[] not null default '{}',
  clue_count_unlocked integer not null default 0,
  earliest_solve_day integer not null default 3,
  created_at_ms bigint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

alter table public.profiles enable row level security;
alter table public.player_cases enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "player_cases_select_own" on public.player_cases;
create policy "player_cases_select_own"
on public.player_cases
for select
using (auth.uid() = user_id);

drop policy if exists "player_cases_insert_own" on public.player_cases;
create policy "player_cases_insert_own"
on public.player_cases
for insert
with check (auth.uid() = user_id);

drop policy if exists "player_cases_update_own" on public.player_cases;
create policy "player_cases_update_own"
on public.player_cases
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
