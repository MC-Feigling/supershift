-- Web Push subscriptions. Each signed-in person stores their own device endpoints.
-- A plan owner with an active share may read and drop stale endpoints of the reader.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_len check (char_length(endpoint) between 20 and 2048),
  constraint push_subscriptions_p256dh_len check (char_length(p256dh) between 20 and 200),
  constraint push_subscriptions_auth_len check (char_length(auth) between 8 and 200)
);

create unique index push_subscriptions_endpoint_idx on public.push_subscriptions (endpoint);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;

revoke all on table public.push_subscriptions from anon, authenticated;
grant select, insert, delete on table public.push_subscriptions to authenticated;

create or replace function private.guard_push_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is distinct from auth.uid() then
    raise exception 'not_owner';
  end if;
  return new;
end;
$$;

create trigger push_subscriptions_guard
  before insert on public.push_subscriptions
  for each row
  execute function private.guard_push_subscription();

revoke all on function private.guard_push_subscription() from public;
grant execute on function private.guard_push_subscription() to authenticated;

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
  );

create policy push_subscriptions_insert on public.push_subscriptions
  for insert to authenticated
  with check (user_id = (select auth.uid()));

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
  );
