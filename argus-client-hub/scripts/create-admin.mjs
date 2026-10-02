// Creates (or resets the password of) a dashboard admin in the Postgres database.
// Usage: npm run admin:create -- --email joy@example.com --name "Joy Howlader"
// The password is generated and printed once. Use --password to set your own (10+ chars).
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import process from "node:process";
import postgres from "postgres";

try {
  process.loadEnvFile?.(".env.local");
} catch {}
try {
  process.loadEnvFile?.(".env");
} catch {}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const email = (args.email || "").trim().toLowerCase();
const name = (args.name || "Joy Howlader").trim();
const role = args.role === "staff" ? "staff" : "admin";
const password = args.password || randomBytes(12).toString("base64url");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (demo mode has a built-in admin, see README).");
  process.exit(1);
}
if (!email.includes("@")) {
  console.error('Usage: npm run admin:create -- --email you@example.com [--name "Your Name"] [--role admin|staff]');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

try {
  const existing = await sql`select id from team_members where email = ${email}`;
  if (existing.length) {
    await sql`update team_members set password_hash = ${hash}, name = ${name}, role = ${role} where email = ${email}`;
    await sql`delete from sessions where member_id = ${existing[0].id}`;
    console.log(`Updated ${email} (${role}).`);
  } else {
    await sql`insert into team_members (id, email, name, role, password_hash) values (${randomUUID()}, ${email}, ${name}, ${role}, ${hash})`;
    console.log(`Created ${email} (${role}).`);
  }
  console.log(`Password: ${password}`);
  console.log("Sign in at /hub/login and change it in Settings → My account.");
} finally {
  await sql.end();
}
