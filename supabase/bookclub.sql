-- =============================================================
-- Ambernath Book Club: who has which book.
--
-- Lives in the same Supabase project as the desk, in its own tables
-- (bc_*). It never reads or changes desk data, and the desk's own rules
-- (schema.sql) keep the desk owner-only even when club members sign in.
--
-- Who may do what:
--   - Visitors (not signed in) see only the shelf: titles, authors,
--     covers, and whether each book is in. No names.
--   - Members see everything in the club: books, who owns them, who
--     has them, requests and history.
--   - A member can add their own books and edit or remove them.
--   - Every lending step (request, approve, hand over, return) goes
--     through the functions below, which check who is allowed to do it.
--   - Admins also invite members and can fix any book or loan.
--
-- Run this whole file once in Supabase -> SQL Editor. Running it again
-- is safe: it adds nothing twice.
-- =============================================================

-- 1. Members and invitations -----------------------------------------------

create table if not exists public.bc_members (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  is_admin boolean not null default false,
  joined_at timestamptz not null default now()
);

create table if not exists public.bc_invites (
  email text primary key check (email = lower(btrim(email)) and email like '%_@_%'),
  name text not null check (length(btrim(name)) between 1 and 60),
  is_admin boolean not null default false,
  invited_by uuid references public.bc_members (id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.bc_is_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bc_members where id = auth.uid());
$$;

create or replace function public.bc_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bc_members where id = auth.uid() and is_admin);
$$;

revoke all on function public.bc_is_member() from public, anon, authenticated;
revoke all on function public.bc_is_admin() from public, anon, authenticated;
grant execute on function public.bc_is_member() to anon, authenticated;
grant execute on function public.bc_is_admin() to anon, authenticated;

-- 2. Books -----------------------------------------------------------------

create table if not exists public.bc_books (
  id bigint generated always as identity primary key,
  title text not null check (length(btrim(title)) between 1 and 200),
  author text not null default '' check (length(author) <= 200),
  cover text check (cover is null or (length(cover) <= 500 and cover ~ '^(covers/[a-z0-9.-]+|https://[^[:space:]"''<>]+)$')),
  isbn text check (isbn is null or isbn ~ '^[0-9Xx]{10,13}$'),
  pages int check (pages is null or pages between 1 and 10000),
  year int check (year is null or year between 0 and 2100),
  note text check (note is null or length(note) <= 500),
  owner_id uuid not null references public.bc_members (id) on delete restrict,
  lendable boolean not null default true,
  added_by uuid references public.bc_members (id) on delete set null default auth.uid(),
  added_at timestamptz not null default now()
);
create index if not exists bc_books_owner on public.bc_books (owner_id);

-- 3. Loans: one row per borrowing, from request to return -----------------
--   requested -> approved -> out -> (returning) -> returned
--   or requested -> declined / cancelled

create table if not exists public.bc_loans (
  id bigint generated always as identity primary key,
  book_id bigint not null references public.bc_books (id) on delete cascade,
  borrower_id uuid not null references public.bc_members (id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'out', 'returning', 'returned', 'declined', 'cancelled')),
  note text check (note is null or length(note) <= 300),
  due_on date,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  handed_at timestamptz,
  returning_at timestamptz,
  returned_at timestamptz,
  closed_at timestamptz
);
create index if not exists bc_loans_book on public.bc_loans (book_id);
-- A book can be with only one borrower at a time.
create unique index if not exists bc_loans_one_holder on public.bc_loans (book_id)
  where status in ('approved', 'out', 'returning');
-- A member has at most one open request or loan per book.
create unique index if not exists bc_loans_one_open_each on public.bc_loans (book_id, borrower_id)
  where status in ('requested', 'approved', 'out', 'returning');

-- 4. Who can read and change the tables directly ---------------------------

alter table public.bc_members enable row level security;
alter table public.bc_invites enable row level security;
alter table public.bc_books enable row level security;
alter table public.bc_loans enable row level security;

revoke all on public.bc_members, public.bc_invites, public.bc_books, public.bc_loans from anon, authenticated;
grant select on public.bc_members, public.bc_books, public.bc_loans to authenticated;
grant update (name) on public.bc_members to authenticated;
grant delete on public.bc_members to authenticated;
grant select, insert, delete on public.bc_invites to authenticated;
grant insert (title, author, cover, isbn, pages, year, note, owner_id, lendable) on public.bc_books to authenticated;
grant update (title, author, cover, isbn, pages, year, note, lendable) on public.bc_books to authenticated;
grant delete on public.bc_books to authenticated;
-- bc_loans has no direct insert/update/delete: only the functions below change it.

drop policy if exists "Members see members" on public.bc_members;
create policy "Members see members" on public.bc_members
  for select to authenticated using ((select public.bc_is_member()));
drop policy if exists "Members rename themselves" on public.bc_members;
create policy "Members rename themselves" on public.bc_members
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "Admins remove members" on public.bc_members;
create policy "Admins remove members" on public.bc_members
  for delete to authenticated using ((select public.bc_is_admin()) and id <> (select auth.uid()));

drop policy if exists "Admins manage invites" on public.bc_invites;
create policy "Admins manage invites" on public.bc_invites
  for all to authenticated using ((select public.bc_is_admin())) with check ((select public.bc_is_admin()));

drop policy if exists "Members see books" on public.bc_books;
create policy "Members see books" on public.bc_books
  for select to authenticated using ((select public.bc_is_member()));
drop policy if exists "Members add their own books" on public.bc_books;
create policy "Members add their own books" on public.bc_books
  for insert to authenticated with check (
    (select public.bc_is_member()) and (owner_id = (select auth.uid()) or (select public.bc_is_admin())));
drop policy if exists "Owners and admins edit books" on public.bc_books;
create policy "Owners and admins edit books" on public.bc_books
  for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.bc_is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.bc_is_admin()));
drop policy if exists "Owners and admins remove books that are in" on public.bc_books;
create policy "Owners and admins remove books that are in" on public.bc_books
  for delete to authenticated using (
    (owner_id = (select auth.uid()) or (select public.bc_is_admin()))
    and not exists (select 1 from public.bc_loans l where l.book_id = bc_books.id and l.status in ('out', 'returning')));

drop policy if exists "Members see loans" on public.bc_loans;
create policy "Members see loans" on public.bc_loans
  for select to authenticated using ((select public.bc_is_member()));

-- 5. Joining -----------------------------------------------------------------
-- Called by the app after every sign-in. Returns the member, or null if this
-- email hasn't been invited. The desk owner is always the first admin.

create or replace function public.bc_join()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  my_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  inv public.bc_invites;
  m public.bc_members;
begin
  if me is null then return null; end if;
  select * into m from public.bc_members where id = me;
  if found then return to_jsonb(m); end if;

  select * into inv from public.bc_invites where email = my_email;
  if found then
    insert into public.bc_members (id, name, is_admin) values (me, inv.name, inv.is_admin) returning * into m;
    delete from public.bc_invites where email = my_email;
    return to_jsonb(m);
  end if;
  return null;
end $$;

-- 6. Lending ---------------------------------------------------------------

create or replace function public.bc__loan_for_update(loan_id bigint)
returns public.bc_loans language plpgsql security definer set search_path = '' as $$
declare l public.bc_loans;
begin
  if not public.bc_is_member() then raise exception 'Only club members can do this.'; end if;
  select * into l from public.bc_loans where id = loan_id for update;
  if not found then raise exception 'That request no longer exists.'; end if;
  return l;
end $$;

create or replace function public.bc__can_manage(book_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.bc_is_admin()
      or exists (select 1 from public.bc_books b where b.id = book_id and b.owner_id = auth.uid());
$$;

-- The Sunday a few weeks out: the default return date.
create or replace function public.bc__sundays_from_now(n int)
returns date language sql stable set search_path = '' as $$
  select (current_date + (7 - extract(isodow from current_date)::int) % 7 + 7 * n)::date;
$$;

-- Ask to borrow. If the book is out, this puts you in the queue.
create or replace function public.bc_request(book_id bigint, note text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare b public.bc_books; new_id bigint;
begin
  if not public.bc_is_member() then raise exception 'Only club members can borrow.'; end if;
  select * into b from public.bc_books where id = book_id;
  if not found then raise exception 'That book is no longer on the shelf.'; end if;
  if b.owner_id = auth.uid() then raise exception 'This is your own book.'; end if;
  if not b.lendable then raise exception 'The owner isn''t lending this one right now.'; end if;
  if exists (select 1 from public.bc_loans l where l.book_id = b.id and l.borrower_id = auth.uid()
             and l.status in ('requested', 'approved', 'out', 'returning')) then
    raise exception 'You''ve already asked for this book.';
  end if;
  insert into public.bc_loans (book_id, borrower_id, note)
  values (b.id, auth.uid(), nullif(btrim(left(coalesce(note, ''), 300)), ''))
  returning id into new_id;
  return new_id;
end $$;

-- The borrower changes their mind (before they have the book).
create or replace function public.bc_cancel(loan_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare l public.bc_loans := public.bc__loan_for_update(loan_id);
begin
  if l.borrower_id <> auth.uid() and not public.bc__can_manage(l.book_id) then raise exception 'That isn''t your request.'; end if;
  if l.status not in ('requested', 'approved') then raise exception 'This can''t be cancelled now.'; end if;
  update public.bc_loans set status = 'cancelled', closed_at = now() where id = l.id;
end $$;

-- The owner says yes (with a return date) or no.
create or replace function public.bc_respond(loan_id bigint, approve boolean, due date default null)
returns void language plpgsql security definer set search_path = '' as $$
declare l public.bc_loans := public.bc__loan_for_update(loan_id);
begin
  if not public.bc__can_manage(l.book_id) then raise exception 'Only the book''s owner can answer this.'; end if;
  if l.status <> 'requested' then raise exception 'This request has already been answered.'; end if;
  if not approve then
    update public.bc_loans set status = 'declined', closed_at = now() where id = l.id;
    return;
  end if;
  if exists (select 1 from public.bc_loans x where x.book_id = l.book_id and x.status in ('approved', 'out', 'returning')) then
    raise exception 'Someone else has this book or is about to get it. Approve this once it''s back.';
  end if;
  if due is not null and due < current_date then raise exception 'The return date is in the past.'; end if;
  update public.bc_loans
     set status = 'approved', approved_at = now(), due_on = coalesce(due, public.bc__sundays_from_now(3))
   where id = l.id;
end $$;

-- Either side confirms the book has changed hands.
create or replace function public.bc_handover(loan_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare l public.bc_loans := public.bc__loan_for_update(loan_id);
begin
  if l.borrower_id <> auth.uid() and not public.bc__can_manage(l.book_id) then raise exception 'Only the owner or the borrower can confirm this.'; end if;
  if l.status <> 'approved' then raise exception 'This book isn''t waiting to be handed over.'; end if;
  update public.bc_loans
     set status = 'out', handed_at = now(), due_on = coalesce(due_on, public.bc__sundays_from_now(3))
   where id = l.id;
end $$;

-- The owner hands a book straight to a member (say, at the Sunday meetup).
create or replace function public.bc_lend(book_id bigint, borrower uuid, due date default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare b public.bc_books; new_id bigint;
begin
  select * into b from public.bc_books where id = book_id;
  if not found then raise exception 'That book is no longer on the shelf.'; end if;
  if not public.bc__can_manage(b.id) then raise exception 'Only the book''s owner can lend it.'; end if;
  if borrower = b.owner_id then raise exception 'They already own it.'; end if;
  if not exists (select 1 from public.bc_members where id = borrower) then raise exception 'That person isn''t a member.'; end if;
  if exists (select 1 from public.bc_loans x where x.book_id = b.id and x.status in ('approved', 'out', 'returning')) then
    raise exception 'Someone else has this book or is about to get it.';
  end if;
  if due is not null and due < current_date then raise exception 'The return date is in the past.'; end if;
  -- Their waiting request (if any) becomes this loan.
  update public.bc_loans
     set status = 'out', approved_at = now(), handed_at = now(), due_on = coalesce(due, public.bc__sundays_from_now(3))
   where bc_loans.book_id = b.id and borrower_id = borrower and status = 'requested'
  returning id into new_id;
  if new_id is null then
    insert into public.bc_loans (book_id, borrower_id, status, approved_at, handed_at, due_on)
    values (b.id, borrower, 'out', now(), now(), coalesce(due, public.bc__sundays_from_now(3)))
    returning id into new_id;
  end if;
  return new_id;
end $$;

-- The borrower says they've given it back; the owner then confirms.
create or replace function public.bc_returning(loan_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare l public.bc_loans := public.bc__loan_for_update(loan_id);
begin
  if l.borrower_id <> auth.uid() then raise exception 'Only the borrower can say this.'; end if;
  if l.status <> 'out' then raise exception 'This book isn''t out with you.'; end if;
  update public.bc_loans set status = 'returning', returning_at = now() where id = l.id;
end $$;

-- The owner confirms they have the book back. This is what makes it "in" again.
create or replace function public.bc_returned(loan_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare l public.bc_loans := public.bc__loan_for_update(loan_id);
begin
  if not public.bc__can_manage(l.book_id) then raise exception 'Only the book''s owner can confirm it''s back.'; end if;
  if l.status not in ('out', 'returning') then raise exception 'This book isn''t out.'; end if;
  update public.bc_loans set status = 'returned', returned_at = now(), closed_at = now() where id = l.id;
end $$;

-- A borrower and owner agree on more time.
create or replace function public.bc_extend(loan_id bigint, due date)
returns void language plpgsql security definer set search_path = '' as $$
declare l public.bc_loans := public.bc__loan_for_update(loan_id);
begin
  if not public.bc__can_manage(l.book_id) then raise exception 'Only the book''s owner can change the return date.'; end if;
  if l.status not in ('approved', 'out', 'returning') then raise exception 'This book isn''t out.'; end if;
  if due is null or due < current_date then raise exception 'Pick a date from today on.'; end if;
  update public.bc_loans set due_on = due where id = l.id;
end $$;

-- 7. What visitors see -------------------------------------------------------

create or replace function public.bc_public_shelf()
returns table (title text, author text, cover text, available boolean)
language sql stable security definer set search_path = '' as $$
  select b.title, b.author, b.cover,
         b.lendable and not exists (select 1 from public.bc_loans l
                                    where l.book_id = b.id and l.status in ('approved', 'out', 'returning'))
    from public.bc_books b
   order by b.title;
$$;

-- 8. Who may call the functions ----------------------------------------------

revoke all on function public.bc_join() from public, anon, authenticated;
revoke all on function public.bc__loan_for_update(bigint) from public, anon, authenticated;
revoke all on function public.bc__can_manage(bigint) from public, anon, authenticated;
revoke all on function public.bc__sundays_from_now(int) from public, anon, authenticated;
revoke all on function public.bc_request(bigint, text) from public, anon, authenticated;
revoke all on function public.bc_cancel(bigint) from public, anon, authenticated;
revoke all on function public.bc_respond(bigint, boolean, date) from public, anon, authenticated;
revoke all on function public.bc_handover(bigint) from public, anon, authenticated;
revoke all on function public.bc_lend(bigint, uuid, date) from public, anon, authenticated;
revoke all on function public.bc_returning(bigint) from public, anon, authenticated;
revoke all on function public.bc_returned(bigint) from public, anon, authenticated;
revoke all on function public.bc_extend(bigint, date) from public, anon, authenticated;
revoke all on function public.bc_public_shelf() from public, anon, authenticated;

grant execute on function public.bc_join() to authenticated;
grant execute on function public.bc_request(bigint, text) to authenticated;
grant execute on function public.bc_cancel(bigint) to authenticated;
grant execute on function public.bc_respond(bigint, boolean, date) to authenticated;
grant execute on function public.bc_handover(bigint) to authenticated;
grant execute on function public.bc_lend(bigint, uuid, date) to authenticated;
grant execute on function public.bc_returning(bigint) to authenticated;
grant execute on function public.bc_returned(bigint) to authenticated;
grant execute on function public.bc_extend(bigint, date) to authenticated;
grant execute on function public.bc_public_shelf() to anon, authenticated;

-- 9. The founder and the first shelf -----------------------------------------
-- The desk owner (you) becomes the club's first member and admin, named Vikas,
-- and owns the club's starting books. Change the name in the app later.

insert into public.bc_members (id, name, is_admin)
select id, 'Vikas', true from public.desk_owner
on conflict (id) do update set is_admin = true;

insert into public.bc_books (title, author, cover, pages, year, owner_id, added_by)
select s.title, s.author, s.cover, s.pages, s.year, o.id, o.id
  from (values
    ('Verity', 'Colleen Hoover', 'covers/verity.jpg', 340, 2018),
    ('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'covers/sapiens-a-brief-history-of-humankind.jpg', 456, 2011),
    ('The Girl in Room 105', 'Chetan Bhagat', 'covers/the-girl-in-room-105.jpg', 336, 2018),
    ('Autobiography of a Yogi', 'Paramahansa Yogananda', 'covers/autobiography-of-a-yogi.jpg', 514, 1946),
    ('1984', 'George Orwell', 'covers/1984.jpg', 328, 1949),
    ('Sputnik Sweetheart', 'Haruki Murakami', 'covers/sputnik-sweetheart.jpg', 240, 1999),
    ('Harry Potter and the Order of the Phoenix', 'J.K. Rowling', 'covers/harry-potter-and-the-order-of-the-phoeni.jpg', 870, 2003),
    ('Skeleton Crew', 'Stephen King', 'covers/skeleton-crew.jpg', 573, 1985),
    ('The Hunger Games', 'Suzanne Collins', 'covers/the-hunger-games.jpg', 397, 2008),
    ('Kafka on the Shore', 'Haruki Murakami', 'covers/kafka-on-the-shore.jpg', 505, 2002),
    ('Catching Fire', 'Suzanne Collins', 'covers/catching-fire.jpg', 400, 2009),
    ('The Personal MBA', 'Josh Kaufman', 'covers/the-personal-mba.jpg', 504, 2010),
    ('Mindset', 'Carol S. Dweck', 'covers/mindset.jpg', 288, 2006),
    ('The Metamorphosis', 'Franz Kafka', 'covers/the-metamorphosis.jpg', 96, 1915),
    ('Frankenstein', 'Mary Shelley', 'covers/frankenstein.jpg', 240, 1818),
    ('Calling Sehmat', 'Harinder Sikka', 'covers/calling-sehmat.jpg', 256, 2008),
    ('Crime and Punishment', 'Fyodor Dostoevsky', 'covers/crime-and-punishment.jpg', 551, 1866),
    ('Flow', 'Mihaly Csikszentmihalyi', 'covers/flow.jpg', 317, 1990),
    ('A Wild Sheep Chase', 'Haruki Murakami', 'covers/a-wild-sheep-chase.jpg', 304, 1982),
    ('The Picture of Dorian Gray', 'Oscar Wilde', 'covers/the-picture-of-dorian-gray.jpg', 246, 1890),
    ('What I Talk About When I Talk About Running', 'Haruki Murakami', 'covers/what-i-talk-about-when-i-talk-about-runn.jpg', 192, 2007),
    ('White Nights', 'Fyodor Dostoevsky', 'covers/white-nights.jpg', 112, 1848),
    ('And Then There Were None', 'Agatha Christie', 'covers/and-then-there-were-none.jpg', 222, 1939),
    ('Man''s Search for Meaning', 'Viktor E. Frankl', 'covers/man-s-search-for-meaning.jpg', 192, 1946),
    ('The Psychology of Money', 'Morgan Housel', 'covers/the-psychology-of-money.jpg', 272, 2020),
    ('Desperation', 'Stephen King', 'covers/desperation.jpg', 616, 1996),
    ('Insomnia', 'Stephen King', 'covers/insomnia.jpg', 719, 1994),
    ('The Street Lawyer', 'John Grisham', 'covers/the-street-lawyer.jpg', 413, 1998),
    ('Meditations', 'Marcus Aurelius', 'covers/meditations.jpg', 203, 180),
    ('The Subtle Art of Not Giving a F*ck', 'Mark Manson', 'covers/the-subtle-art-of-not-giving-a-f-ck.jpg', 224, 2016),
    ('Show Your Work!', 'Austin Kleon', 'covers/show-your-work.jpg', 224, 2014),
    ('The Da Vinci Code', 'Dan Brown', 'covers/the-da-vinci-code.jpg', 489, 2003)
  ) as s (title, author, cover, pages, year)
  cross join (select id from public.desk_owner limit 1) o
 where not exists (select 1 from public.bc_books b where b.title = s.title and b.owner_id = o.id);

-- 10. Genres and Open Library links (added 16 Nov 2026) ----------------------
-- genres: keys from the site's own genre list (content/shelves.js).
-- ol_work: the book's Open Library work, which the app uses to show its
-- description and rating. Both are optional; owners can change genres.

alter table public.bc_books add column if not exists genres text[] not null default '{}';
alter table public.bc_books add column if not exists ol_work text;

alter table public.bc_books drop constraint if exists bc_books_genres_known;
alter table public.bc_books add constraint bc_books_genres_known check (
  genres <@ array['fantasy', 'paranormal', 'scifi', 'horror', 'thriller', 'literary', 'classics', 'comingofage',
                  'romance', 'myth', 'history', 'war', 'lives', 'science', 'tech', 'money', 'mind', 'philosophy',
                  'craft', 'india']::text[]
  and cardinality(genres) <= 5);
alter table public.bc_books drop constraint if exists bc_books_ol_work_shape;
alter table public.bc_books add constraint bc_books_ol_work_shape check (ol_work is null or ol_work ~ '^/works/OL[0-9]+W$');

grant insert (genres, ol_work), update (genres, ol_work) on public.bc_books to authenticated;

-- The starting 32: genres chosen by hand, works matched by hand. Only fills
-- books that have no genres or work yet, so it never overwrites a member's edits.
update public.bc_books b
   set genres = case when cardinality(b.genres) = 0 then s.genres::text[] else b.genres end,
       ol_work = coalesce(b.ol_work, s.ol_work)
  from (values
    ('Verity', '{thriller}', '/works/OL20068530W'),
    ('Sapiens: A Brief History of Humankind', '{history,science}', '/works/OL17075811W'),
    ('The Girl in Room 105', '{thriller,romance,india}', '/works/OL20764592W'),
    ('Autobiography of a Yogi', '{lives,philosophy,india}', '/works/OL528094W'),
    ('1984', '{classics,scifi}', '/works/OL1168083W'),
    ('Sputnik Sweetheart', '{literary,romance}', '/works/OL2625443W'),
    ('Harry Potter and the Order of the Phoenix', '{fantasy,comingofage}', '/works/OL82548W'),
    ('Skeleton Crew', '{horror}', '/works/OL81627W'),
    ('The Hunger Games', '{scifi,comingofage}', '/works/OL5735363W'),
    ('Kafka on the Shore', '{literary,fantasy}', '/works/OL2625431W'),
    ('Catching Fire', '{scifi,comingofage}', '/works/OL5735360W'),
    ('The Personal MBA', '{money}', '/works/OL15473892W'),
    ('Mindset', '{mind}', '/works/OL2003465W'),
    ('The Metamorphosis', '{classics}', '/works/OL498556W'),
    ('Frankenstein', '{classics,horror,scifi}', '/works/OL450063W'),
    ('Calling Sehmat', '{thriller,war,india}', '/works/OL20670981W'),
    ('Crime and Punishment', '{classics}', '/works/OL166894W'),
    ('Flow', '{mind}', '/works/OL278571W'),
    ('A Wild Sheep Chase', '{literary}', '/works/OL2625441W'),
    ('The Picture of Dorian Gray', '{classics}', '/works/OL8193416W'),
    ('What I Talk About When I Talk About Running', '{lives}', '/works/OL2625422W'),
    ('White Nights', '{classics,romance}', '/works/OL166952W'),
    ('And Then There Were None', '{thriller,classics}', '/works/OL471565W'),
    ('Man''s Search for Meaning', '{philosophy,lives,mind}', '/works/OL1268413W'),
    ('The Psychology of Money', '{money,mind}', '/works/OL21640039W'),
    ('Desperation', '{horror}', '/works/OL81611W'),
    ('Insomnia', '{horror,fantasy}', '/works/OL81603W'),
    ('The Street Lawyer', '{thriller}', '/works/OL77014W'),
    ('Meditations', '{philosophy,classics}', '/works/OL1317211W'),
    ('The Subtle Art of Not Giving a F*ck', '{mind}', '/works/OL17590212W'),
    ('Show Your Work!', '{craft}', '/works/OL16821630W'),
    ('The Da Vinci Code', '{thriller}', '/works/OL76837W')
  ) as s (title, genres, ol_work)
 where b.title = s.title
   and b.owner_id in (select id from public.desk_owner);
