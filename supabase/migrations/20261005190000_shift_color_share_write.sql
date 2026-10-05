-- Shift colors chosen from a fixed palette. One share may grant write access to placements.

create or replace function private.shift_color_index(name text)
returns smallint
language plpgsql
immutable
set search_path = ''
as $$
declare
  normalized text := lower(btrim(coalesce(name, '')));
  hash bigint := 0;
  i integer;
begin
  for i in 1..char_length(normalized) loop
    hash := ((hash * 33) + ascii(substr(normalized, i, 1))) % 4294967296;
  end loop;
  return (hash % 8)::smallint;
end;
$$;

revoke all on function private.shift_color_index(text) from public;

alter table public.shift_types
  add column color_index smallint not null default 0;

alter table public.shift_types disable trigger shift_types_guard;

update public.shift_types
set color_index = private.shift_color_index(name);

alter table public.shift_types enable trigger shift_types_guard;

alter table public.shift_types
  add constraint shift_types_color_index_range check (color_index between 0 and 7);

alter table public.plan_shares
  add column can_write boolean not null default false;

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

  if new.color_index is null or new.color_index < 0 or new.color_index > 7 then
    raise exception 'invalid_color';
  end if;

  return new;
end;
$$;

create or replace function private.guard_placement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  type_owner uuid;
  writer_ok boolean;
begin
  writer_ok := new.owner_id is not distinct from auth.uid();

  if not writer_ok then
    select exists (
      select 1
      from public.plan_shares as share
      where share.owner_id = new.owner_id
        and share.grantee_id = auth.uid()
        and share.status = 'active'
        and share.can_write = true
    ) into writer_ok;
  end if;

  if not writer_ok then
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

  new.note := btrim(coalesce(new.note, ''));

  return new;
end;
$$;

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
  new.can_write := coalesce(new.can_write, false);

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

create or replace function private.guard_plan_share_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('schichtwerk.internal', true) = 'attach' then
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.owner_email := old.owner_email;
    new.grantee_email := old.grantee_email;
    new.can_write := old.can_write;
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
  new.can_write := old.can_write;
  new.created_at := old.created_at;
  new.status := 'revoked';
  new.revoked_at := now();
  return new;
end;
$$;

drop policy if exists placements_insert on public.placements;
create policy placements_insert on public.placements
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.plan_shares as share
      where share.owner_id = placements.owner_id
        and share.grantee_id = (select auth.uid())
        and share.status = 'active'
        and share.can_write = true
    )
  );

drop policy if exists placements_delete on public.placements;
create policy placements_delete on public.placements
  for delete to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.plan_shares as share
      where share.owner_id = placements.owner_id
        and share.grantee_id = (select auth.uid())
        and share.status = 'active'
        and share.can_write = true
    )
  );

drop policy if exists push_subscriptions_select on public.push_subscriptions;
create policy push_subscriptions_select on public.push_subscriptions
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.plan_shares as share
      where share.owner_id = (select auth.uid())
        and share.grantee_id = push_subscriptions.user_id
        and share.status = 'active'
    )
    or exists (
      select 1
      from public.plan_shares as share
      where share.grantee_id = (select auth.uid())
        and share.owner_id = push_subscriptions.user_id
        and share.status = 'active'
        and share.can_write = true
    )
  );

drop policy if exists push_subscriptions_delete on public.push_subscriptions;
create policy push_subscriptions_delete on public.push_subscriptions
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.plan_shares as share
      where share.owner_id = (select auth.uid())
        and share.grantee_id = push_subscriptions.user_id
        and share.status = 'active'
    )
    or exists (
      select 1
      from public.plan_shares as share
      where share.grantee_id = (select auth.uid())
        and share.owner_id = push_subscriptions.user_id
        and share.status = 'active'
        and share.can_write = true
    )
  );
