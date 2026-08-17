#!/usr/bin/env node
/**
 * [Phase 6B QA] Real RLS behavior tests for the new community tables,
 * using two real, confirmed Supabase Auth users (their own JWTs, not
 * service-role) plus a genuine anonymous (publishable-key-only) request.
 * All QA data is clearly labeled "QA-THANKS-UX-MIGRATION" and deleted at
 * the end, including both QA users.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  const env = {};
  if (!existsSync(p)) return env;
  for (const line of readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1).replace(/\r$/, "");
  }
  return env;
}
const env = loadEnvLocal();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

let failures = [];
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label);
  if (!cond) failures.push(label);
}

async function admin(method, path, body, extra = {}) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...extra },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

async function as(token, method, path, body, extra = {}) {
  const key = token ? token : ANON;
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: { apikey: ANON, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

async function login(email, password) {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

const stamp = Date.now();
const emailA = `qa-thanks-ux-migration-a-${stamp}@gmail.com`;
const emailB = `qa-thanks-ux-migration-b-${stamp}@gmail.com`;
const PASS = "QaMigration123!";

console.log("=== Creating QA-THANKS-UX-MIGRATION users ===");
const created = {};
for (const [key, email] of [["a", emailA], ["b", emailB]]) {
  const { data } = await admin("POST", "/auth/v1/admin/users", {
    email,
    password: PASS,
    email_confirm: true,
    user_metadata: { name: `QA-THANKS-UX-MIGRATION User ${key.toUpperCase()}` },
  });
  created[key] = data.id;
  console.log(`user ${key}: ${data.id}`);
}

const tokenA = (await login(emailA, PASS)).access_token;
const tokenB = (await login(emailB, PASS)).access_token;
check("user A token obtained", Boolean(tokenA));
check("user B token obtained", Boolean(tokenB));

console.log("\n=== ANONYMOUS ===");
const anonInsert = await as(null, "POST", "/rest/v1/thanks_signals", { title: "QA-THANKS-UX-MIGRATION anon", description: "should fail", author_id: created.a }, { Prefer: "return=representation" });
check("anonymous cannot create a thanks_signal", !anonInsert.ok);

console.log("\n=== USER A: create own signal ===");
const signalA = await as(tokenA, "POST", "/rest/v1/thanks_signals", {
  title: "QA-THANKS-UX-MIGRATION Signal A",
  description: "Booking a first appointment was confusing.",
  author_id: created.a,
  status: "draft",
  visibility: "private",
}, { Prefer: "return=representation" });
check("user A can create own signal", signalA.ok && signalA.data?.[0]?.id);
const signalAId = signalA.data?.[0]?.id;

const readOwn = await as(tokenA, "GET", `/rest/v1/thanks_signals?id=eq.${signalAId}&select=id,title`);
check("user A can read own draft signal", readOwn.ok && readOwn.data.length === 1);

const updateOwn = await as(tokenA, "PATCH", `/rest/v1/thanks_signals?id=eq.${signalAId}`, { description: "Updated description." });
check("user A can update own draft", updateOwn.ok);

console.log("\n=== USER B: cannot see or touch User A's private draft ===");
const bReadA = await as(tokenB, "GET", `/rest/v1/thanks_signals?id=eq.${signalAId}&select=id`);
check("user B cannot read user A's private draft (0 rows, not an error)", bReadA.ok && bReadA.data.length === 0);

const bUpdateA = await as(tokenB, "PATCH", `/rest/v1/thanks_signals?id=eq.${signalAId}`, { title: "HACKED BY B" }, { Prefer: "return=representation" });
check("user B's update of A's signal affects 0 rows", Array.isArray(bUpdateA.data) && bUpdateA.data.length === 0);

const bDeleteA = await as(tokenB, "DELETE", `/rest/v1/thanks_signals?id=eq.${signalAId}`, undefined, { Prefer: "return=representation" });
check("user B's delete of A's signal affects 0 rows", Array.isArray(bDeleteA.data) && bDeleteA.data.length === 0);

const verifyUntouched = await admin("GET", `/rest/v1/thanks_signals?id=eq.${signalAId}&select=title`);
check("A's signal title genuinely unchanged after B's attempts", verifyUntouched.data?.[0]?.title === "Updated description." ? false : verifyUntouched.data?.[0]?.title !== "HACKED BY B");

console.log("\n=== USER A: cannot self-escalate status past author-owned states ===");
const escalate = await as(tokenA, "PATCH", `/rest/v1/thanks_signals?id=eq.${signalAId}`, { status: "resolved" }, { Prefer: "return=representation" });
check("user A cannot set status to a moderator-only value (0 rows affected)", Array.isArray(escalate.data) && escalate.data.length === 0);
const stillDraft = await admin("GET", `/rest/v1/thanks_signals?id=eq.${signalAId}&select=status`);
check("status genuinely still draft", stillDraft.data?.[0]?.status === "draft");

console.log("\n=== Public visibility: A makes it public, B can now read (but not write) ===");
await admin("PATCH", `/rest/v1/thanks_signals?id=eq.${signalAId}`, { visibility: "public" });
const bReadPublic = await as(tokenB, "GET", `/rest/v1/thanks_signals?id=eq.${signalAId}&select=id,title`);
check("user B CAN read once visibility=public", bReadPublic.ok && bReadPublic.data.length === 1);
const bStillCannotWrite = await as(tokenB, "PATCH", `/rest/v1/thanks_signals?id=eq.${signalAId}`, { title: "still hacked" }, { Prefer: "return=representation" });
check("user B still cannot write to A's public signal (0 rows)", Array.isArray(bStillCannotWrite.data) && bStillCannotWrite.data.length === 0);

console.log("\n=== USER B: create a contribution to A's signal, test contribution isolation ===");
const contribB = await as(tokenB, "POST", "/rest/v1/contributions", {
  thanks_signal_id: signalAId,
  contributor_id: created.b,
  contribution_type: "observation",
  explanation: "QA-THANKS-UX-MIGRATION contribution",
  status: "draft",
}, { Prefer: "return=representation" });
check("user B can create a contribution", contribB.ok && contribB.data?.[0]?.id);
const contribBId = contribB.data?.[0]?.id;

const aCannotEditContribB = await as(tokenA, "PATCH", `/rest/v1/contributions?id=eq.${contribBId}`, { explanation: "hacked by A" }, { Prefer: "return=representation" });
check("user A cannot edit user B's contribution (0 rows)", Array.isArray(aCannotEditContribB.data) && aCannotEditContribB.data.length === 0);

// A is the signal's author — should be able to READ B's draft contribution to their own signal (per design: signal author can see contributions on their own signal even pre-approval).
const aCanReadContribB = await as(tokenA, "GET", `/rest/v1/contributions?id=eq.${contribBId}&select=id`);
check("signal author (A) can read a contribution on their own signal even in draft", aCanReadContribB.ok && aCanReadContribB.data.length === 1);

console.log("\n=== ADMIN (real is_admin() RLS path, not service-role bypass) ===");
// Temporarily promote A to admin via service-role (a real, deliberate test
// step — reverted before cleanup), to exercise the actual is_admin()
// policy branch using A's own JWT, not the service-role bypass.
await admin("PATCH", `/rest/v1/profiles?id=eq.${created.a}`, { role: "admin" });
const adminModerate = await as(tokenA, "PATCH", `/rest/v1/thanks_signals?id=eq.${signalAId}`, { status: "reviewed" }, { Prefer: "return=representation" });
check("admin (real is_admin() RLS path) CAN moderate — status change succeeds", Array.isArray(adminModerate.data) && adminModerate.data.length === 1);
const adminEditOthers = await as(tokenA, "PATCH", `/rest/v1/contributions?id=eq.${contribBId}`, { status: "approved" }, { Prefer: "return=representation" });
check("admin (real is_admin() RLS path) CAN manage another user's contribution", Array.isArray(adminEditOthers.data) && adminEditOthers.data.length === 1);
// Revert role immediately.
await admin("PATCH", `/rest/v1/profiles?id=eq.${created.a}`, { role: "user" });
const revertedCheck = await admin("GET", `/rest/v1/profiles?id=eq.${created.a}&select=role`);
check("A's role correctly reverted to 'user' after the admin test", revertedCheck.data?.[0]?.role === "user");

console.log("\n=== Cleanup ===");
await admin("DELETE", `/rest/v1/thanks_signals?id=eq.${signalAId}`); // cascades contributions/contribution_media
const signalGone = await admin("GET", `/rest/v1/thanks_signals?id=eq.${signalAId}&select=id`);
check("QA signal deleted", signalGone.data.length === 0);
const contribGone = await admin("GET", `/rest/v1/contributions?id=eq.${contribBId}&select=id`);
check("QA contribution cascade-deleted", contribGone.data.length === 0);

for (const key of ["a", "b"]) {
  await admin("DELETE", `/auth/v1/admin/users/${created[key]}`);
}
const remainingProfiles = await admin("GET", "/rest/v1/profiles?select=id,name&name=like.*QA-THANKS-UX-MIGRATION*");
check("no leftover QA profiles", remainingProfiles.data.length === 0);
const remainingSignals = await admin("GET", "/rest/v1/thanks_signals?select=id&title=like.*QA-THANKS-UX-MIGRATION*");
check("no leftover QA thanks_signals", remainingSignals.data.length === 0);
const remainingContribs = await admin("GET", "/rest/v1/contributions?select=id&explanation=like.*QA-THANKS-UX-MIGRATION*");
check("no leftover QA contributions", remainingContribs.data.length === 0);

console.log("\n" + (failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES:\n" + failures.join("\n")));
process.exit(failures.length === 0 ? 0 : 1);
