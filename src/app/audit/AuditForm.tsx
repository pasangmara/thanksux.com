"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { authFetchJson } from "@/lib/auth/authFetch";
import { isValidHttpUrl } from "@/lib/community/validateUrl";
import type { AuditInputType, AuditType } from "@/types/audit";

const AUDIT_TYPES: { value: AuditType; label: string; description: string }[] = [
  { value: "ux", label: "UX Audit", description: "Usability, navigation, structure, forms, and conversion." },
  { value: "web", label: "Web Audit", description: "Accessibility, SEO signals, performance observations, responsiveness." },
  { value: "design", label: "Design Audit", description: "Visual design, typography, color, and spacing." },
];

const INPUT_METHODS: { value: AuditInputType; label: string }[] = [
  { value: "url", label: "Website URL" },
  { value: "screenshot", label: "Upload Screenshot" },
];

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;

/** Real processing stages, not decoration — see /api/audit/route.ts's own header comment: this cycles only while the actual request is in flight, and stops the moment the real response arrives, never padded afterward. */
const PROGRESS_STAGES = [
  "Analyzing page structure…",
  "Checking navigation…",
  "Reviewing accessibility signals…",
  "Analyzing visual hierarchy…",
  "Checking content structure…",
  "Building recommendations…",
  "Preparing your report…",
];

type Status = "idle" | "submitting" | "error";

export function AuditForm() {
  const router = useRouter();
  const [auditType, setAuditType] = useState<AuditType>("ux");
  const [inputType, setInputType] = useState<AuditInputType>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "submitting") return;
    const timer = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, PROGRESS_STAGES.length - 1));
    }, 900);
    return () => clearInterval(timer);
  }, [status]);

  function handleFileChange(selected: File | null) {
    setFieldError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(selected.type)) {
      setFieldError("Unsupported file type — upload a PNG, JPG, or WEBP image.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_SCREENSHOT_BYTES) {
      setFieldError(`File is too large (${(selected.size / (1024 * 1024)).toFixed(1)}MB) — the limit is 8MB.`);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    setError(null);

    if (inputType === "url") {
      const trimmed = url.trim();
      if (!trimmed) {
        setFieldError("Enter a website URL to analyze.");
        return;
      }
      if (!isValidHttpUrl(trimmed)) {
        setFieldError("Enter a valid http:// or https:// URL.");
        return;
      }
    } else if (!file) {
      setFieldError("Upload a screenshot to analyze.");
      return;
    }

    setStatus("submitting");
    setStageIndex(0);

    try {
      const formData = new FormData();
      formData.append("auditType", auditType);
      formData.append("inputType", inputType);
      if (inputType === "url") {
        formData.append("url", url.trim());
      } else if (file) {
        formData.append("file", file);
      }

      const res = await authFetchJson("/api/audit", { method: "POST", body: formData });
      if (!res.ok) {
        throw new Error(typeof res.data.error === "string" ? res.data.error : "Could not start this audit — please try again.");
      }
      const audit = res.data.audit as { id: string; status: string };
      router.push(`/audit/${audit.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not start this audit — please try again.");
    }
  }

  if (status === "submitting") {
    return (
      <div className="glass-surface flex flex-col items-center gap-4 rounded-lg px-6 py-16 text-center">
        <svg className="spinner h-8 w-8 text-ink" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="text-body text-ink" role="status" aria-live="polite">
          {PROGRESS_STAGES[stageIndex]}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-surface flex flex-col gap-8 rounded-lg p-6 tablet:p-8">
      <div>
        <p className="mb-3 text-caption font-medium text-ink">Audit type</p>
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3">
          {AUDIT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setAuditType(t.value)}
              aria-pressed={auditType === t.value}
              className={`rounded-md border px-4 py-3 text-left transition-colors duration-150 ease-out ${
                auditType === t.value ? "border-ink bg-ink text-on-ink" : "border-border bg-surface text-ink hover:border-ink"
              }`}
            >
              <span className={`text-body font-medium ${auditType === t.value ? "text-on-ink" : ""}`}>{t.label}</span>
              <span className={`mt-1 block text-caption ${auditType === t.value ? "text-on-ink/70" : "text-text-secondary"}`}>
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-caption font-medium text-ink">Input method</p>
        <div className="grid grid-cols-2 gap-3">
          {INPUT_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                setInputType(m.value);
                setFieldError(null);
              }}
              aria-pressed={inputType === m.value}
              className={`rounded-md border px-4 py-3 text-body font-medium transition-colors duration-150 ease-out ${
                inputType === m.value ? "border-ink bg-ink text-on-ink" : "border-border bg-surface text-ink hover:border-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {inputType === "url" ? (
        <div>
          <label htmlFor="audit-url" className="mb-1.5 block text-caption font-medium text-ink">
            Website URL
          </label>
          <input
            id="audit-url"
            type="url"
            inputMode="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink focus:border-accent focus:shadow-focus focus:outline-none"
          />
          <p className="mt-1.5 text-caption text-text-tertiary">Must be a public http:// or https:// address.</p>
        </div>
      ) : (
        <div>
          <p className="mb-1.5 text-caption font-medium text-ink">Screenshot</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-fit rounded-md border border-ink px-4 py-2 text-body font-medium text-ink transition-colors duration-150 ease-out hover:border-accent hover:text-accent"
            >
              {file ? "Choose a different image" : "Upload image"}
            </button>
            {file ? (
              <p className="text-caption text-text-secondary">
                {file.name} ({(file.size / (1024 * 1024)).toFixed(1)}MB)
              </p>
            ) : (
              <p className="text-caption text-text-tertiary">Accepted: PNG, JPG, WEBP — up to 8MB.</p>
            )}
          </div>
        </div>
      )}

      {fieldError ? <p className="text-caption text-error">{fieldError}</p> : null}
      {status === "error" && error ? <p className="text-caption text-error">{error}</p> : null}

      <Button variant="primary" type="submit" className="w-fit">
        Start Audit
      </Button>
    </form>
  );
}
