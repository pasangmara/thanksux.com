import { getCurrentMember } from "@/lib/auth/session";
import { feedbackCsv } from "@/lib/services/feedback";

/** Same 18 columns as the Google Sheet. Works without n8n. */
export async function GET() {
  const member = await getCurrentMember();
  if (!member) return new Response("Unauthorized", { status: 401 });
  const csv = await feedbackCsv();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="argus-feedback-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
