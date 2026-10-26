-- Live calendar updates for the owner and the person the plan is shared with.
-- Full replica identity so delete events still match the owner filter.

alter table public.placements replica identity full;
alter table public.shift_types replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'placements'
  ) then
    alter publication supabase_realtime add table public.placements;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shift_types'
  ) then
    alter publication supabase_realtime add table public.shift_types;
  end if;
end $$;
