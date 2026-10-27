-- The desk's database, for Supabase.
--
-- Run it once in your project: SQL Editor -> New query -> paste all of this -> Run.
-- Running it again is safe: it doesn't delete anything you've written.
--
-- The rules, kept by the database itself (row-level security):
--   - Anyone can read items you mark as shared (projects, library items and doors only).
--   - Only the owner's account can read everything else, or change anything at all.
--   - The owner is whoever is listed in desk_owner, which only this SQL editor can change.


-- 1. Who owns the desk ------------------------------------------------------

create table if not exists public.desk_owner (
  id uuid primary key references auth.users (id) on delete cascade
);
alter table public.desk_owner enable row level security; -- no rules, so the website can't read or change it
revoke all on public.desk_owner from anon, authenticated;

create or replace function public.desk_is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.desk_owner where id = auth.uid());
$$;
revoke all on function public.desk_is_owner() from public;
grant execute on function public.desk_is_owner() to anon, authenticated;


-- 2. Everything on the desk, one row each ------------------------------------

create table if not exists public.desk_items (
  id uuid primary key,
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('project', 'note', 'library', 'idea', 'link', 'offline', 'setting')),
  data jsonb not null default '{}'::jsonb,
  position double precision not null default 0,
  shared boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- notes, ideas and the rest can never be shared, even by mistake
  constraint desk_items_shareable check (not shared or kind in ('project', 'library', 'link'))
);
create index if not exists desk_items_owner_kind on public.desk_items (owner, kind);

create or replace function public.desk_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists desk_items_touch on public.desk_items;
create trigger desk_items_touch before update on public.desk_items
  for each row execute function public.desk_touch();


-- 3. Who may do what ---------------------------------------------------------

alter table public.desk_items enable row level security;

drop policy if exists "Anyone can read shared items" on public.desk_items;
create policy "Anyone can read shared items" on public.desk_items
  for select to anon, authenticated
  using (shared and not archived);

drop policy if exists "The owner can read everything" on public.desk_items;
create policy "The owner can read everything" on public.desk_items
  for select to authenticated
  using (owner = (select auth.uid()) and (select public.desk_is_owner()));

drop policy if exists "The owner can add" on public.desk_items;
create policy "The owner can add" on public.desk_items
  for insert to authenticated
  with check (owner = (select auth.uid()) and (select public.desk_is_owner()));

drop policy if exists "The owner can change" on public.desk_items;
create policy "The owner can change" on public.desk_items
  for update to authenticated
  using (owner = (select auth.uid()) and (select public.desk_is_owner()))
  with check (owner = (select auth.uid()) and (select public.desk_is_owner()));

drop policy if exists "The owner can delete" on public.desk_items;
create policy "The owner can delete" on public.desk_items
  for delete to authenticated
  using (owner = (select auth.uid()) and (select public.desk_is_owner()));

revoke all on public.desk_items from anon, authenticated;
grant select on public.desk_items to anon;
grant select, insert, update, delete on public.desk_items to authenticated;


-- 4. Make yourself the owner -------------------------------------------------
--
-- First add yourself under Authentication -> Users -> Add user.
-- Then put your email below, select just that line, and run it.
--
-- insert into public.desk_owner (id) select id from auth.users where email = 'you@example.com' on conflict do nothing;
