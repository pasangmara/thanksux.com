-- [UX Audit engine trustworthiness] Purely additive: new columns only, no
-- drops, no data loss. Backfills existing rows with the values that are
-- actually true of them — every finding persisted before this migration
-- came from a rule reading a literal DOM attribute or file byte count
-- (rules.ts had no other kind of rule), so 'observed'/'high' is not a
-- guess for those rows, it's what already happened. Existing audits'
-- evidence_coverage/confidence are backfilled from their own
-- category_scores jsonb so historical reports don't regress to 0%/'low'
-- the moment this ships.

alter table public.audit_findings
  add column if not exists verification_status text not null default 'observed'
    check (verification_status in ('observed', 'inferred', 'not_verified')),
  add column if not exists confidence text not null default 'high'
    check (confidence in ('high', 'medium', 'low'));

alter table public.audits
  add column if not exists evidence_coverage_percent int not null default 0,
  add column if not exists confidence text not null default 'low'
    check (confidence in ('high', 'medium', 'low'));

-- Backfill completed audits' coverage/confidence from their own persisted
-- category_scores (14 total categories — see ALL_CATEGORIES in
-- scoring.ts), using the same thresholds computeScores() uses going
-- forward, so old and new reports read consistently.
update public.audits
set
  evidence_coverage_percent = round(
    100.0 * (
      select count(*)
      from jsonb_array_elements(category_scores) c
      where c->>'evidenceLevel' = 'sufficient'
    ) / 14.0
  )::int,
  confidence = case
    when (
      select count(*)
      from jsonb_array_elements(category_scores) c
      where c->>'evidenceLevel' = 'sufficient'
    ) >= 9 then 'high'   -- >= ~65%
    when (
      select count(*)
      from jsonb_array_elements(category_scores) c
      where c->>'evidenceLevel' = 'sufficient'
    ) >= 5 then 'medium' -- >= ~35%
    else 'low'
  end
where status = 'completed' and jsonb_typeof(category_scores) = 'array';
