import { NextResponse } from "next/server";
import { getCurrentPublicUser, updateOwnProfile } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const PROFILE_UPDATE_RATE_LIMIT = 20;
const PROFILE_UPDATE_RATE_WINDOW_MS = 10 * 60 * 1000;

const MAX_LEN = { name: 100, username: 30, bio: 500, website: 300, avatarUrl: 2000 } as const;

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

/** GET /api/auth/user/profile — the signed-in visitor's own profile, or 401. */
export async function GET() {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    return NextResponse.json({ profile: current.profile, email: current.email });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load your profile." },
      { status: 502 },
    );
  }
}

/** PUT — updates only the caller's own profile; RLS (profiles_self_update) is the real enforcement even if this handler had a bug. */
export async function PUT(request: Request) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rateLimit = checkRateLimit(`profile-update:${clientIp(request)}`, PROFILE_UPDATE_RATE_LIMIT, PROFILE_UPDATE_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many updates — please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const name = str(body.name, MAX_LEN.name);
    if (name !== undefined && !name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });

    const updated = await updateOwnProfile({
      name,
      username: body.username === null ? null : str(body.username, MAX_LEN.username),
      bio: body.bio === null ? null : str(body.bio, MAX_LEN.bio),
      website: body.website === null ? null : str(body.website, MAX_LEN.website),
      avatarUrl: body.avatarUrl === null ? null : str(body.avatarUrl, MAX_LEN.avatarUrl),
    });
    return NextResponse.json({ profile: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update profile." }, { status: 400 });
  }
}
