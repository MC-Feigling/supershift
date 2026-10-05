-- Lookup and claim a pending link share. Authenticated caller only.

create or replace function private.lookup_plan_invite(share_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid;
  share public.plan_shares%rowtype;
begin
  caller := auth.uid();
  if caller is null then
    raise exception 'not_authenticated';
  end if;

  if share_token is null or share_token !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  select * into share
  from public.plan_shares
  where invite_token = share_token;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'owner_email', share.owner_email,
    'status', share.status,
    'is_own', share.owner_id = caller,
    'grantee_is_self', share.grantee_id is not null and share.grantee_id = caller,
    'can_write', share.can_write
  );
end;
$$;

create or replace function private.claim_plan_share(share_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid;
  caller_email text;
  share public.plan_shares%rowtype;
  claimed_id uuid;
begin
  caller := auth.uid();
  if caller is null then
    raise exception 'not_authenticated';
  end if;

  if share_token is null or share_token !~ '^[0-9a-f]{64}$' then
    raise exception 'invite_missing';
  end if;

  select * into share
  from public.plan_shares
  where invite_token = share_token;

  if not found then
    raise exception 'invite_missing';
  end if;

  if share.status = 'revoked' then
    raise exception 'invite_revoked';
  end if;

  if share.owner_id = caller then
    raise exception 'self_share';
  end if;

  if share.status = 'active' then
    if share.grantee_id = caller then
      return jsonb_build_object(
        'owner_id', share.owner_id,
        'owner_email', share.owner_email
      );
    end if;
    raise exception 'invite_used';
  end if;

  if share.status is distinct from 'pending' or share.invite_channel is distinct from 'link' then
    raise exception 'invite_missing';
  end if;

  select lower(email) into caller_email
  from auth.users
  where id = caller;

  if caller_email is null then
    raise exception 'not_authenticated';
  end if;

  perform set_config('schichtwerk.internal', 'claim', true);

  update public.plan_shares
  set
    grantee_id = caller,
    grantee_email = caller_email,
    status = 'active'
  where id = share.id
    and status = 'pending'
  returning id into claimed_id;

  if claimed_id is null then
    raise exception 'invite_used';
  end if;

  return jsonb_build_object(
    'owner_id', share.owner_id,
    'owner_email', share.owner_email
  );
end;
$$;

create or replace function public.lookup_plan_invite(share_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.lookup_plan_invite(share_token);
$$;

create or replace function public.claim_plan_share(share_token text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.claim_plan_share(share_token);
$$;

revoke all on function private.lookup_plan_invite(text) from public, anon, authenticated;
revoke all on function private.claim_plan_share(text) from public, anon, authenticated;
revoke all on function public.lookup_plan_invite(text) from public, anon;
revoke all on function public.claim_plan_share(text) from public, anon;

grant execute on function public.lookup_plan_invite(text) to authenticated;
grant execute on function public.claim_plan_share(text) to authenticated;
