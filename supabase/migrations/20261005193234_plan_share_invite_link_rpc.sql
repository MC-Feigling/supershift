-- Update share insert/update for email and link channels.

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

  new.invite_channel := coalesce(new.invite_channel, 'email');
  new.can_write := coalesce(new.can_write, false);

  select lower(email) into found_owner_email
  from auth.users
  where id = new.owner_id;

  if found_owner_email is null then
    raise exception 'not_owner';
  end if;

  new.owner_email := found_owner_email;
  new.revoked_at := null;

  if new.invite_channel = 'link' then
    new.grantee_email := null;
    new.grantee_id := null;
    new.status := 'pending';
    new.invite_token := pg_catalog.replace(
      pg_catalog.gen_random_uuid()::text || pg_catalog.gen_random_uuid()::text,
      '-',
      ''
    );
    return new;
  end if;

  if new.invite_channel is distinct from 'email' then
    raise exception 'invite_channel';
  end if;

  if new.grantee_email is null then
    raise exception 'invite_email';
  end if;

  new.grantee_email := lower(btrim(new.grantee_email));
  new.invite_token := null;

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
    new.invite_channel := old.invite_channel;
    new.invite_token := old.invite_token;
    new.created_at := old.created_at;
    new.revoked_at := null;
    new.status := 'active';
    return new;
  end if;

  if current_setting('schichtwerk.internal', true) = 'claim' then
    if old.status is distinct from 'pending' or old.invite_channel is distinct from 'link' then
      raise exception 'invite_used';
    end if;

    if new.grantee_id is null or new.grantee_id = old.owner_id then
      raise exception 'self_share';
    end if;

    new.id := old.id;
    new.owner_id := old.owner_id;
    new.owner_email := old.owner_email;
    new.invite_channel := old.invite_channel;
    new.invite_token := old.invite_token;
    new.can_write := old.can_write;
    new.created_at := old.created_at;
    new.revoked_at := null;
    new.status := 'active';
    new.grantee_email := lower(btrim(new.grantee_email));
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
  new.invite_channel := old.invite_channel;
  new.invite_token := old.invite_token;
  new.created_at := old.created_at;
  new.status := 'revoked';
  new.revoked_at := now();
  return new;
end;
$$;
