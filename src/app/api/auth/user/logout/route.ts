import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Real server-side logout — supabase.auth.signOut() revokes the refresh token at Supabase's Auth server, not merely clearing a client-side cookie. */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not log out — please try again." },
      { status: 502 },
    );
  }
}
