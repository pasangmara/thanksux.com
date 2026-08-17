-- [Phase 6E — Contribution + DesignResponse foundation] Purely additive
-- columns on the two tables already created in 0012 — no table renamed,
-- no existing column touched, no RLS changed here (see 0015 for the
-- separate, security-motivated RLS fix). Every new column is nullable
-- text, matching the existing convention on both tables (category/context/
-- audience on thanks_signals, summary/research_findings/design_decisions/
-- outcome here) — "required" is enforced at the application submit-gate
-- layer, not by a NOT NULL constraint, exactly like Phase 6C's
-- thanks_signals fields.
--
-- contributions.title: the product spec calls for a Contribution `title`
-- field; no equivalent column existed in 0012 (explanation/research/
-- observation/proposed_direction cover the contributor's own pitch, but
-- none of them is a short title).
--
-- design_responses gains five columns to cover the requested field set
-- that 0012's four existing narrative columns (summary, research_findings,
-- design_decisions, outcome) and two existing URL columns (prototype_url,
-- figma_url) don't fully cover: problem_statement, approach, tools_used,
-- case_study_url, external_url. The existing `case_study` jsonb column is
-- untouched and unused by this phase — `case_study_url` is a plain link,
-- a different concept from that flexible narrative blob.

alter table public.contributions add column if not exists title text;

alter table public.design_responses add column if not exists problem_statement text;
alter table public.design_responses add column if not exists approach text;
alter table public.design_responses add column if not exists tools_used text;
alter table public.design_responses add column if not exists case_study_url text;
alter table public.design_responses add column if not exists external_url text;
