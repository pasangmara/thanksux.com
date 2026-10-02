import { cronAuthorized } from "@/lib/cron";
import { deliverDue } from "@/lib/integrations/outbox";

/** Retries waiting/failed n8n events. Call every 10–15 minutes once n8n is connected. */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 });
  return Response.json(await deliverDue());
}
