-- Personal shift plan. Owners write their rows. One open share grants read access.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table public.shift_types (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint shift_types_name_trimmed check (name = btrim(name)),
  constraint shift_types_name_len check (char_length(name) between 1 and 40)
);

create unique index shift_types_owner_name_lower_idx
  on public.shift_types (owner_id, lower(name));

create index shift_types_owner_idx on public.shift_types (owner_id);

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  shift_type_id uuid not null references public.shift_types (id) on delete cascade,
  starts_on date not null,
  ends_on date,
  repeats_weekly boolean not null default false,
  created_at timestamptz not null default now(),
  constraint placements_series_range check (
    (repeats_weekly = false and ends_on is null)
    or (repeats_weekly = true and ends_on is not null and ends_on >= starts_on)
  )
);

create index placements_owner_idx on public.placements (owner_id);
create index placements_shift_type_idx on public.placements (shift_type_id);

create table public.plan_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  owner_email text not null,
  grantee_email text not null,
  grantee_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint plan_shares_status check (status in ('pending', 'active', 'revoked')),
  constraint plan_shares_email_len check (
    char_length(grantee_email) between 3 and 254
    and char_length(owner_email) between 3 and 254
  ),
  constraint plan_shares_email_shape check (
    grantee_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and owner_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint plan_shares_not_self check (grantee_id is null or grantee_id <> owner_id)
);

create unique index plan_shares_one_open_idx
  on public.plan_shares (owner_id)
  where status in ('pending', 'active');

create index plan_shares_grantee_active_idx
  on public.plan_shares (grantee_id)
  where status = 'active';

create index plan_shares_email_pending_idx
  on public.plan_shares (grantee_email)
  where status = 'pending';

alter table public.shift_types enable row level security;
alter table public.placements enable row level security;
alter table public.plan_shares enable row level security;

alter table public.shift_types force row level security;
alter table public.placements force row level security;
alter table public.plan_shares force row level security;

revoke all on table public.shift_types from anon, authenticated;
revoke all on table public.placements from anon, authenticated;
revoke all on table public.plan_shares from anon, authenticated;

grant select, insert, update, delete on table public.shift_types to authenticated;
grant select, insert, delete on table public.placements to authenticated;
grant select, insert on table public.plan_shares to authenticated;
grant update (status, revoked_at) on table public.plan_shares to authenticated;

create or replace function private.guard_shift_type()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is distinct from auth.uid() then
    raise exception 'not_owner';
  end if;

  if tg_op = 'UPDATE' and new.owner_id is distinct from old.owner_id then
    raise exception 'not_owner';
  end if;

  new.name := btrim(new.name);
  return new;
end;
$$;

create trigger shift_types_guard
  before insert or update on public.shift_types
  for each row
  execute function private.guard_shift_type();

create or replace function private.guard_placement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  type_owner uuid;
begin
  if new.owner_id is distinct from auth.uid() then
    raise exception 'not_owner';
  end if;

  select owner_id into type_owner
  from public.shift_types
  where id = new.shift_type_id;

  if type_owner is distinct from new.owner_id then
    raise exception 'shift_type_mismatch';
  end if;

  if new.repeats_weekly then
    if new.ends_on is null or new.ends_on < new.starts_on then
      raise exception 'series_end';
    end if;
  else
    new.ends_on := null;
  end if;

  return new;
end;
$$;

create trigger placements_guard
  before insert on public.placements
  for each row
  execute function private.guard_placement();

create or replace function private.prepare_plan_share()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_owner_email text;
  found_id uuid;
begin
  if new.owner_id is distinct from auth.uid() then
    raise exception 'not_owner';
  end if;

  new.grantee_email := lower(btrim(new.grantee_email));

  select lower(email) into found_owner_email
  from auth.users
  where id = new.owner_id;

  if found_owner_email is null then
    raise exception 'not_owner';
  end if;

  if found_owner_email = new.grantee_email then
    raise exception 'self_share';
  end if;

  new.owner_email := found_owner_email;

  select id into found_id
  from auth.users
  where lower(email) = new.grantee_email
  limit 1;

  if found_id is not null then
    new.grantee_id := found_id;
    new.status := 'active';
  else
    new.grantee_id := null;
    new.status := 'pending';
  end if;

  new.revoked_at := null;
  return new;
end;
$$;

create trigger plan_shares_prepare
  before insert on public.plan_shares
  for each row
  execute function private.prepare_plan_share();

create or replace function private.guard_plan_share_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Signup attaches a pending invite inside the auth trigger. That path is not a user revoke.
  if current_setting('schichtwerk.internal', true) = 'attach' then
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.owner_email := old.owner_email;
    new.grantee_email := old.grantee_email;
    new.created_at := old.created_at;
    new.revoked_at := null;
    new.status := 'active';
    return new;
  end if;

  if old.owner_id is distinct from auth.uid() then
    raise exception 'not_owner';
  end if;

  if old.status = 'revoked' or new.status is distinct from 'revoked' then
    raise exception 'only_revoke';
  end if;

  new.id := old.id;
  new.owner_id := old.owner_id;
  new.owner_email := old.owner_email;
  new.grantee_email := old.grantee_email;
  new.grantee_id := old.grantee_id;
  new.created_at := old.created_at;
  new.status := 'revoked';
  new.revoked_at := now();
  return new;
end;
$$;

create trigger plan_shares_guard_update
  before update on public.plan_shares
  for each row
  execute function private.guard_plan_share_update();

create or replace function private.attach_pending_plan_shares()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('schichtwerk.internal', 'attach', true);

  update public.plan_shares
  set
    grantee_id = new.id,
    status = 'active'
  where status = 'pending'
    and grantee_email = lower(coalesce(new.email, ''));

  return new;
end;
$$;

create trigger on_auth_user_created_attach_shares
  after insert on auth.users
  for each row
  execute function private.attach_pending_plan_shares();

revoke all on function private.guard_shift_type() from public;
revoke all on function private.guard_placement() from public;
revoke all on function private.prepare_plan_share() from public;
revoke all on function private.guard_plan_share_update() from public;
revoke all on function private.attach_pending_plan_shares() from public;

grant execute on function private.guard_shift_type() to authenticated;
grant execute on function private.guard_placement() to authenticated;
grant execute on function private.prepare_plan_share() to authenticated;
grant execute on function private.guard_plan_share_update() to authenticated;

create policy shift_types_select on public.shift_types
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.plan_shares as share
      where share.owner_id = shift_types.owner_id
        and share.grantee_id = (select auth.uid())
        and share.status = 'active'
    )
  );

create policy shift_types_insert on public.shift_types
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy shift_types_update on public.shift_types
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy shift_types_delete on public.shift_types
  for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy placements_select on public.placements
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.plan_shares as share
      where share.owner_id = placements.owner_id
        and share.grantee_id = (select auth.uid())
        and share.status = 'active'
    )
  );

create policy placements_insert on public.placements
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy placements_delete on public.placements
  for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy plan_shares_select on public.plan_shares
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (
      grantee_id = (select auth.uid())
      and status = 'active'
    )
  );

create policy plan_shares_insert on public.plan_shares
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy plan_shares_update on public.plan_shares
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

grant usage on schema public to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema private to supabase_auth_admin;
    grant execute on function private.attach_pending_plan_shares() to supabase_auth_admin;
  end if;
end $$;
