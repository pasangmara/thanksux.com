import { NextResponse } from "next/server";
import { getBannerForAdmin, moveBanner, setBannerEnabled } from "@/lib/cms/bannersRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";

type BannerAction = "enable" | "disable" | "moveUp" | "moveDown";
const ACTIONS: BannerAction[] = ["enable", "disable", "moveUp", "moveDown"];

/**
 * [Promotional Banner / Campaign System] Small, closed action-dispatch
 * endpoint — same `{ action }` shape as /api/admin/reviews/[id]/action's
 * moderation route, reused here for the admin list's Enable/Disable/Move
 * up/Move down row actions.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = body.action as BannerAction;
  if (!action || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  switch (action) {
    case "enable": {
      const banner = await setBannerEnabled(id, true);
      if (!banner) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ banner });
    }
    case "disable": {
      const banner = await setBannerEnabled(id, false);
      if (!banner) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ banner });
    }
    case "moveUp":
    case "moveDown": {
      await moveBanner(id, action === "moveUp" ? -1 : 1);
      const banner = await getBannerForAdmin(id);
      if (!banner) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ banner });
    }
  }
}
