-- Optional note on a placement. Set at insert. Owners write, readers with an active share can see it.

alter table public.placements
  add column note text not null default '';

alter table public.placements
  add constraint placements_note_len check (char_length(note) <= 200);

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

  new.note := btrim(coalesce(new.note, ''));

  return new;
end;
$$;
