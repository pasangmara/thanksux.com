import { NextResponse } from "next/server";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { createMediaAsset } from "@/lib/cms/supabase/mediaUpload";
import { completeAudit, createAudit, failAudit, setAuditStatus } from "@/lib/audit/auditsRepository";
import { ssrfSafeFetch, FetchTimeoutError, ResponseTooLargeError, UnsafeUrlError } from "@/lib/audit/ssrfSafeFetch";
import { extractWebsiteSignals } from "@/lib/audit/extractWebsiteSignals";
import { extractScreenshotSignals } from "@/lib/audit/extractScreenshotSignals";
import { runScreenshotAudit, runWebsiteAudit } from "@/lib/audit/engine";
import type { AuditCreateInput, AuditType } from "@/types/audit";

/**
 * [UX Audit Engine] POST /api/audit — validate -> create (status
 * 'pending') -> analyze inline -> persist findings/scores -> return the
 * audit id. Public and anonymous-friendly by design (migration 0022's
 * documented security model): a signed-in visitor's audit is owned
 * (`user_id`), an anonymous one is not, and either way the created audit
 * is returned directly in this response (never re-read via a follow-up
 * SELECT — the audits_select_own RLS policy wouldn't allow an anonymous
 * session to read its own anonymous row back anyway, see
 * auditsRepository.ts's header comment).
 *
 * Analysis runs synchronously in this same request rather than via a
 * background job queue: a single SSRF-safe fetch + regex-based extraction
 * + deterministic rule evaluation is bounded and fast (the fetch itself
 * has an 8s hard timeout — see ssrfSafeFetch.ts) — this project has no
 * job-queue/websocket infrastructure, and inventing one for a
 * sub-10-second operation would be over-engineering, not the "appropriate
 * async/progress architecture" §26 asks for. The client's staged progress
 * UI (AuditProgress.tsx) covers this same wait with real, not padded,
 * elapsed time.
 */

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 15 * 60 * 1000;

const AUDIT_TYPES: AuditType[] = ["ux", "web", "design"];
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`audit-create:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many audits started — please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const auditTypeRaw = String(formData.get("auditType") ?? "");
  const inputType = String(formData.get("inputType") ?? "");
  if (!AUDIT_TYPES.includes(auditTypeRaw as AuditType)) {
    return NextResponse.json({ error: "Choose an audit type — UX, Web, or Design." }, { status: 400 });
  }
  if (inputType !== "url" && inputType !== "screenshot") {
    return NextResponse.json({ error: "Choose a website URL or a screenshot to analyze." }, { status: 400 });
  }
  const auditType = auditTypeRaw as AuditType;

  const current = await getCurrentPublicUser();
  const userId = current?.authUserId ?? null;

  if (inputType === "url") {
    return handleUrlAudit(formData, auditType, userId);
  }
  return handleScreenshotAudit(formData, auditType, userId);
}

async function handleUrlAudit(formData: FormData, auditType: AuditType, userId: string | null) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    return NextResponse.json({ error: "Enter a website URL to analyze." }, { status: 400 });
  }

  const input: AuditCreateInput = { auditType, inputType: "url", url };
  const audit = await createAudit(input, userId, null);

  try {
    await setAuditStatus(audit.id, "fetching");
    const fetched = await ssrfSafeFetch(url);

    await setAuditStatus(audit.id, "analyzing");
    const evidence = extractWebsiteSignals(fetched.body, url, fetched.finalUrl, fetched.status);

    await setAuditStatus(audit.id, "scoring");
    const { findings, categoryScores, overallScore, evidenceCoveragePercent, confidence } = runWebsiteAudit(evidence, auditType);

    await completeAudit(audit.id, {
      findings,
      categoryScores,
      overallScore,
      evidenceCoveragePercent,
      confidence,
      evidence: evidence as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ audit: { id: audit.id, status: "completed" } }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof UnsafeUrlError
        ? err.message
        : err instanceof FetchTimeoutError
          ? err.message
          : err instanceof ResponseTooLargeError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Could not analyze this URL.";
    await failAudit(audit.id, message);
    return NextResponse.json({ audit: { id: audit.id, status: "failed" } }, { status: 201 });
  }
}

async function handleScreenshotAudit(formData: FormData, auditType: AuditType, userId: string | null) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Upload a screenshot to analyze." }, { status: 400 });
  }
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type — upload a PNG, JPG, or WEBP image." }, { status: 400 });
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return NextResponse.json(
      { error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB) — the limit is ${MAX_SCREENSHOT_BYTES / (1024 * 1024)}MB.` },
      { status: 400 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Failed to read the uploaded file." }, { status: 500 });
  }

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  let created: { id: string; src: string };
  try {
    created = await createMediaAsset({
      storagePath: `audits/${safeName}`,
      bytes: buffer,
      contentType: file.type,
      uploadedBy: userId,
      originalFilename: typeof file.name === "string" ? file.name.slice(0, 200) : null,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed — please try again." }, { status: 500 });
  }

  const input: AuditCreateInput = { auditType, inputType: "screenshot" };
  const audit = await createAudit(input, userId, created.id);

  try {
    await setAuditStatus(audit.id, "analyzing");
    const evidence = extractScreenshotSignals(buffer, file.type);

    await setAuditStatus(audit.id, "scoring");
    const { findings, categoryScores, overallScore, evidenceCoveragePercent, confidence } = runScreenshotAudit(evidence, auditType);

    await completeAudit(audit.id, {
      findings,
      categoryScores,
      overallScore,
      evidenceCoveragePercent,
      confidence,
      evidence: evidence as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ audit: { id: audit.id, status: "completed" } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not analyze this screenshot.";
    await failAudit(audit.id, message);
    return NextResponse.json({ audit: { id: audit.id, status: "failed" } }, { status: 201 });
  }
}
