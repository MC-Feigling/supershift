-- Invite token on the one open share, and an optional placement note.
-- NOTE_MAX_LENGTH in the app is 80. Invite tokens are 64 hex characters.

alter table public.placements
  add column note text;

alter table public.placements
  add constraint placements_note_len check (
    note is null or (note = btrim(note) and char_length(note) between 1 and 80)
  );

alter table public.plan_shares
  add column invite_token text;

update public.plan_shares
set invite_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where invite_token is null;

alter table public.plan_shares
  alter column invite_token set not null;

alter table public.plan_shares
  alter column invite_token set default (
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  );

create unique index plan_shares_invite_token_idx
  on public.plan_shares (invite_token);

alter table public.plan_shares
  alter column grantee_email set default '';

alter table public.plan_shares drop constraint plan_shares_email_len;
alter table public.plan_shares drop constraint plan_shares_email_shape;

alter table public.plan_shares add constraint plan_shares_email_len check (
  (grantee_email = '' or char_length(grantee_email) between 3 and 254)
  and char_length(owner_email) between 3 and 254
);

alter table public.plan_shares add constraint plan_shares_email_shape check (
  (
    grantee_email = ''
    or grantee_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
  and owner_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
);

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

  if new.note is not null then
    new.note := btrim(new.note);
    if new.note = '' then
      new.note := null;
    end if;
  end if;

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

  new.grantee_email := lower(btrim(coalesce(new.grantee_email, '')));
  new.invite_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  select lower(email) into found_owner_email
  from auth.users
  where id = new.owner_id;

  if found_owner_email is null then
    raise exception 'not_owner';
  end if;

  new.owner_email := found_owner_email;

  if new.grantee_email = '' then
    new.grantee_id := null;
    new.status := 'pending';
  else
    if found_owner_email = new.grantee_email then
      raise exception 'self_share';
    end if;

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
declare
  caller_email text;
begin
  if current_setting('schichtwerk.internal', true) = 'claim' then
    if auth.uid() is null or auth.uid() = old.owner_id then
      raise exception 'not_owner';
    end if;

    if old.status = 'revoked' then
      raise exception 'invite_revoked';
    end if;

    if old.status = 'active' and old.grantee_id is distinct from auth.uid() then
      raise exception 'invite_taken';
    end if;

    new.id := old.id;
    new.owner_id := old.owner_id;
    new.owner_email := old.owner_email;
    new.invite_token := old.invite_token;
    new.created_at := old.created_at;
    new.revoked_at := null;
    new.status := 'active';
    new.grantee_id := auth.uid();

    if old.grantee_email = '' then
      select lower(email) into caller_email
      from auth.users
      where id = auth.uid();
      new.grantee_email := caller_email;
    else
      new.grantee_email := old.grantee_email;
    end if;

    return new;
  end if;

  -- Signup attaches a pending invite inside the auth trigger. That path is not a user revoke.
  if current_setting('schichtwerk.internal', true) = 'attach' then
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.owner_email := old.owner_email;
    new.grantee_email := old.grantee_email;
    new.invite_token := old.invite_token;
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
  new.invite_token := old.invite_token;
  new.created_at := old.created_at;
  new.status := 'revoked';
  new.revoked_at := now();
  return new;
end;
$$;

create or replace function private.attach_pending_plan_shares()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(btrim(new.email), '') = '' then
    return new;
  end if;

  perform set_config('schichtwerk.internal', 'attach', true);

  update public.plan_shares
  set
    grantee_id = new.id,
    status = 'active'
  where status = 'pending'
    and grantee_email <> ''
    and grantee_email = lower(new.email);

  return new;
end;
$$;

create or replace function public.preview_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  share_status text;
  share_grantee uuid;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return 'closed';
  end if;

  select status, grantee_id
  into share_status, share_grantee
  from public.plan_shares
  where invite_token = p_token;

  if not found or share_status = 'revoked' then
    return 'closed';
  end if;

  if share_status = 'pending' then
    return 'open';
  end if;

  if share_status = 'active' and share_grantee = auth.uid() then
    return 'yours';
  end if;

  return 'closed';
end;
$$;

create or replace function public.claim_plan_share(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  share_row public.plan_shares%rowtype;
  caller_email text;
  confirmed_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'invite_invalid';
  end if;

  select *
  into share_row
  from public.plan_shares
  where invite_token = p_token
  for update;

  if not found then
    raise exception 'invite_invalid';
  end if;

  if share_row.owner_id = auth.uid() then
    raise exception 'self_share';
  end if;

  if share_row.status = 'revoked' then
    raise exception 'invite_revoked';
  end if;

  if share_row.status = 'active' then
    if share_row.grantee_id = auth.uid() then
      return;
    end if;
    raise exception 'invite_taken';
  end if;

  if share_row.status is distinct from 'pending' then
    raise exception 'invite_invalid';
  end if;

  select lower(email), email_confirmed_at
  into caller_email, confirmed_at
  from auth.users
  where id = auth.uid();

  if caller_email is null or caller_email = '' then
    raise exception 'invite_invalid';
  end if;

  if share_row.grantee_email <> '' and share_row.grantee_email is distinct from caller_email then
    raise exception 'invite_email_mismatch';
  end if;

  if share_row.grantee_email <> '' and confirmed_at is null then
    raise exception 'invite_unconfirmed';
  end if;

  perform set_config('schichtwerk.internal', 'claim', true);

  update public.plan_shares
  set status = 'active'
  where id = share_row.id;
end;
$$;

revoke all on function public.preview_invite(text) from public;
revoke all on function public.claim_plan_share(text) from public;
revoke all on function public.preview_invite(text) from anon, authenticated;
revoke all on function public.claim_plan_share(text) from anon, authenticated;

grant execute on function public.preview_invite(text) to anon, authenticated;
grant execute on function public.claim_plan_share(text) to authenticated;
