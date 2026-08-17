import { promises as fs } from "fs";
import path from "path";

/**
 * [CMS Phase D2] Low-level JSON file store — the repository-native
 * persistence mechanism this phase implements instead of a database.
 *
 * Why a file store and not a database: the task that created this file
 * was explicit that installing a database (Postgres/Supabase/Firebase/
 * etc.) requires justifying it first, and this project already has a
 * deliberate zero-runtime-dependency policy (COMPONENT_NORMALIZATION.md
 * §11) that nothing in this phase's brief asked to break. A JSON file
 * under `data/`, read/written with Node's built-in `fs`, is exactly the
 * "lightweight local datastore (SQLite/JSON-on-disk via a server route)"
 * `PORTFOLIO_CMS_ARCHITECTURE.md` §12 already named as this project's
 * Stage 1.5 — real, not a database, not localStorage, and requires no new
 * package.
 *
 * Server-only: every function here uses Node's `fs`/`path`, so this
 * module must only be imported from Server Components, Route Handlers, or
 * other server-side code — never from a "use client" file (the browser
 * has no filesystem). The admin UI reaches this indirectly, through the
 * `/api/admin/**` Route Handlers (src/app/api/admin/**), never directly.
 *
 * KNOWN LIMITATION, stated plainly rather than papered over: this only
 * persists correctly on a server with a persistent, writable filesystem
 * (this sandbox, or `next start` on a normal VM/container with a durable
 * disk). On an ephemeral/serverless deploy target (e.g. Vercel's default
 * runtime, where the filesystem is read-only or reset per invocation),
 * writes here would not survive — that would require a real external
 * database, which is explicitly out of scope for this phase per the task
 * that created it. Deploying to such a target is a decision for a future
 * phase, not something this file can quietly work around.
 */

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePathFor(filename: string): string {
  return path.join(DATA_DIR, filename);
}

/**
 * Reads a JSON file from `data/<filename>`. If it doesn't exist yet, calls
 * `seed()` to produce the initial value, writes it (so every subsequent
 * read/write operates on the same on-disk file — the seed only ever runs
 * once), and returns it. `seed` is a function, not a value, so it's only
 * evaluated when actually needed.
 */
export async function readJsonFile<T>(filename: string, seed: () => T): Promise<T> {
  await ensureDataDir();
  const filePath = filePathFor(filename);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if (isNotFoundError(err)) {
      const seeded = seed();
      await writeJsonFile(filename, seeded);
      return seeded;
    }
    throw err;
  }
}

/**
 * Writes `data/<filename>`, atomically: written to a temp file first, then
 * renamed into place, so a crash/interrupt mid-write can never leave a
 * half-written, corrupt JSON file behind for the next read to trip over.
 *
 * The rename is retried on `EPERM`/`EBUSY`: on Windows, renaming onto an
 * existing destination can transiently fail with one of those codes if
 * another handle (a concurrent read, an AV scanner) has the destination
 * briefly open — observed for real during this phase's own testing
 * (concurrent Server Components reading `settings.json` while an API
 * route wrote it). A short retry loop is the standard, safe fix; it does
 * not weaken the atomicity guarantee — the temp file is only ever renamed
 * once it's fully written.
 */
export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = filePathFor(filename);
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fs.rename(tmpPath, filePath);
      return;
    } catch (err) {
      const retryable = isRetryableRenameError(err);
      if (!retryable || attempt === maxAttempts) {
        // Clean up the temp file on a non-retryable/final failure so it
        // doesn't linger — the next read's seed logic only looks for the
        // real filename, but an orphaned .tmp file is still clutter.
        await fs.unlink(tmpPath).catch(() => {});
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 20 * attempt));
    }
  }
}

function isRetryableRenameError(err: unknown): boolean {
  const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: string }).code : undefined;
  return code === "EPERM" || code === "EBUSY";
}

function isNotFoundError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "ENOENT";
}
