-- Dedicated shared-reader event log. Does not access or change Desk objects.
create table if not exists public.agentic_reader_events (
 seq bigint generated always as identity primary key,
 id uuid not null unique,
 event jsonb not null,
 received_at timestamptz not null default now()
);
alter table public.agentic_reader_events enable row level security;
revoke all on public.agentic_reader_events from anon,authenticated;
create or replace function public.agentic_sync(batch jsonb default '[]', after_seq bigint default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; result jsonb;
begin
 if jsonb_typeof(batch)<>'array' or jsonb_array_length(batch)>100 or octet_length(batch::text)>1000000 then raise exception 'Invalid batch'; end if;
 for item in select value from jsonb_array_elements(batch) loop
  if item->>'type' not in ('open','activity','section','bookmark','follow','feedback','comment','preference','selection','exposure','decision') or length(item->>'article')>160 or octet_length(item::text)>50000 or not(item ? 'id' and item ? 'payload' and item ? 'at') then raise exception 'Invalid event'; end if;
  insert into public.agentic_reader_events(id,event) values((item->>'id')::uuid,item) on conflict(id) do nothing;
 end loop;
 select coalesce(jsonb_agg(jsonb_build_object('seq',seq,'event',event) order by seq),'[]') into result
 from (select seq,event from public.agentic_reader_events where seq>greatest(0,after_seq) order by seq limit 500) s;
 return jsonb_build_object('rows',result);
end $$;
revoke all on function public.agentic_sync(jsonb,bigint) from public;
grant execute on function public.agentic_sync(jsonb,bigint) to anon,authenticated;
-- Deliberate single-audience design: the public website shares this profile and notebook.
-- No anonymous direct access to tables, SQL execution, or Desk data is granted.
