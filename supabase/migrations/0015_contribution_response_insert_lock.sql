-- [Phase 6E — security fix, same class as 0013] `contributions_author_insert`
-- and `design_responses_author_insert` (0012) restricted only `contributor_id`/
-- `author_id`, never `status` (or, for design_responses, `published_project_id`)
-- — so a normal user could INSERT a brand-new row already at `status =
-- 'approved'`/`'published'`, or a design_response linking `published_project_id`
-- to any existing real project, with zero admin involvement. Confirmed live
-- against the real Supabase project before this fix (both vectors,
-- including the published_project_id case using a real project id).
--
-- Fix, same minimal pattern as 0013: every new row an author inserts must
-- start at `status = 'draft'`; a design_response additionally can never be
-- inserted with `published_project_id` already set (that column is
-- admin/moderation-only from the start, not just after publish). The
-- existing author_update policy on design_responses restricts status but
-- not published_project_id either — tightened the same way so an author
-- can't set it later via update while status is still in their own
-- editable range.
--
-- No other policy, table, or column touched.

drop policy if exists "contributions_author_insert" on public.contributions;
create policy "contributions_author_insert" on public.contributions
  for insert with check (contributor_id = auth.uid() and status = 'draft');

drop policy if exists "design_responses_author_insert" on public.design_responses;
create policy "design_responses_author_insert" on public.design_responses
  for insert with check (author_id = auth.uid() and status = 'draft' and published_project_id is null);

drop policy if exists "design_responses_author_update" on public.design_responses;
create policy "design_responses_author_update" on public.design_responses
  for update
  using (author_id = auth.uid() and status in ('draft','submitted','under_review') and published_project_id is null)
  with check (author_id = auth.uid() and status in ('draft','submitted','under_review') and published_project_id is null);
