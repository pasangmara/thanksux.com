-- [Phase 6D — security fix] `thanks_signals_author_insert`/`_author_update`
-- (0012) restricted `author_id`/`status` but never `visibility`, so a normal
-- author could set `visibility = 'public'` on their own row directly — via
-- INSERT (a brand-new row, no existing row needed) or via UPDATE (leaving
-- `status` inside the already-allowed 'draft'/'submitted' set) — bypassing
-- moderation entirely. Confirmed live against the real Supabase project
-- before this fix (both vectors), and the resulting row was genuinely
-- servable at /signals/[id].
--
-- Fix: the same one-clause tightening, applied consistently to both
-- author-write policies — a normal author's insert/update must always keep
-- `visibility = 'private'`. Only `thanks_signals_admin_all` (using
-- `is_admin()`, unrestricted by column, unchanged here) can ever set
-- `visibility = 'public'`. No other policy, table, or column touched;
-- `thanks_signals_select`/`_author_delete`/`_admin_all` and every other
-- table's RLS are untouched.

drop policy if exists "thanks_signals_author_insert" on public.thanks_signals;
create policy "thanks_signals_author_insert" on public.thanks_signals
  for insert with check (author_id = auth.uid() and visibility = 'private');

drop policy if exists "thanks_signals_author_update" on public.thanks_signals;
create policy "thanks_signals_author_update" on public.thanks_signals
  for update
  using (author_id = auth.uid() and status in ('draft','submitted') and visibility = 'private')
  with check (author_id = auth.uid() and status in ('draft','submitted') and visibility = 'private');
