/**
 * [Phase 4 — Supabase cutover] The single switch controlling whether
 * projectsRepository.ts / siteContentRepository.ts / leadsRepository.ts
 * read AND write via Supabase, or via data/*.json. Defaults to JSON
 * (unset or any value other than "supabase") — flipping DATA_BACKEND back
 * to unset in .env.local is the entire rollback mechanism; no code change
 * needed either way.
 *
 * Deliberately ONE flag for both directions per domain — Phase 4A briefly
 * had reads on Supabase while writes stayed on JSON, and that gap produced
 * a real, live stale-data bug (a corrected phone number existed in JSON
 * but not Supabase) the moment an admin saved while the flag was on. Every
 * domain switched by this flag now moves both directions together.
 *
 * getHeroContent/getHeroVisuals, getMarketingSettings, getLeadFormSettings
 * stay hard-wired to JSON regardless of this flag — see each function's
 * own header comment for why (Hero: a real schema gap, would visibly
 * regress the homepage; Marketing/LeadForm: no Supabase table exists yet).
 */
export function isSupabaseBackendEnabled(): boolean {
  return process.env.DATA_BACKEND === "supabase";
}
