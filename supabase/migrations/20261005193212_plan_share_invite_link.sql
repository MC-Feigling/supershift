-- Share by copyable link. One open share still. First signed-in visitor who is not the owner claims it.

alter table public.plan_shares
  drop constraint plan_shares_email_len,
  drop constraint plan_shares_email_shape;

alter table public.plan_shares
  alter column grantee_email drop not null;

alter table public.plan_shares
  add column invite_channel text not null default 'email',
  add column invite_token text;

alter table public.plan_shares
  add constraint plan_shares_channel check (invite_channel in ('email', 'link')),
  add constraint plan_shares_email_len check (
    char_length(owner_email) between 3 and 254
    and (grantee_email is null or char_length(grantee_email) between 3 and 254)
  ),
  add constraint plan_shares_email_shape check (
    owner_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and (
      grantee_email is null
      or grantee_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  ),
  add constraint plan_shares_token_shape check (
    invite_token is null or invite_token ~ '^[0-9a-f]{64}$'
  ),
  add constraint plan_shares_channel_fields check (
    (invite_channel = 'email' and grantee_email is not null and invite_token is null)
    or (invite_channel = 'link' and invite_token is not null)
  );

create unique index plan_shares_invite_token_idx
  on public.plan_shares (invite_token)
  where invite_token is not null;
