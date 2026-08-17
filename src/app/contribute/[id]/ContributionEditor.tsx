"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { FloatingLabelInput } from "@/components/experimental/FloatingLabelInput";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import { authFetchJson } from "@/lib/auth/authFetch";
import {
  CONTRIBUTION_TYPE_FIELDS,
  CONTRIBUTION_TYPES,
  COMMON_RESPONSE_FIELDS,
  type Contribution,
  type DesignResponse,
  type DesignResponseFieldKey,
} from "@/types/contribution";
import { ContributionMediaUploader, type MediaItem } from "./ContributionMediaUploader";

const selectClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink transition-colors duration-150 ease-out focus:border-accent focus:shadow-focus focus:outline-none";
const textareaClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink transition-colors duration-150 ease-out focus:border-accent focus:shadow-focus focus:outline-none";
const inputClass = textareaClass;

type ResponseFieldState = Record<DesignResponseFieldKey, string>;

function responseToState(dr: DesignResponse): ResponseFieldState {
  return {
    discipline: dr.discipline || "",
    summary: dr.summary || "",
    researchFindings: dr.researchFindings || "",
    designDecisions: dr.designDecisions || "",
    outcome: dr.outcome || "",
    problemStatement: dr.problemStatement || "",
    approach: dr.approach || "",
    toolsUsed: dr.toolsUsed || "",
    prototypeUrl: dr.prototypeUrl || "",
    figmaUrl: dr.figmaUrl || "",
    caseStudyUrl: dr.caseStudyUrl || "",
    externalUrl: dr.externalUrl || "",
  };
}

/**
 * [Phase 6E §8 — extensible editor] Progressive disclosure: pick a
 * Contribution Type first, then only that type's relevant DesignResponse
 * fields render (from the one central `CONTRIBUTION_TYPE_FIELDS` config,
 * src/types/contribution.ts — never hardcoded per-type markup here). Saving
 * only ever sends the fields currently visible (common fields + the
 * selected type's fields), so switching types back and forth never
 * silently blanks data entered under a different type.
 */
export function ContributionEditor({
  contribution,
  designResponse,
  editable,
  initialMedia,
}: {
  contribution: Contribution;
  designResponse: DesignResponse;
  editable: boolean;
  initialMedia: MediaItem[];
}) {
  const [title, setTitle] = useState(contribution.title ?? "");
  const [contributionType, setContributionType] = useState(contribution.contributionType ?? "");
  const [explanation, setExplanation] = useState(contribution.explanation ?? "");
  const [fields, setFields] = useState<ResponseFieldState>(responseToState(designResponse));
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(contribution.status !== "draft");
  const [finalStatus, setFinalStatus] = useState(contribution.status);
  const saveState = useSaveStatus();
  const submitState = useSaveStatus();

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  const typeFields = contributionType && contributionType in CONTRIBUTION_TYPE_FIELDS
    ? CONTRIBUTION_TYPE_FIELDS[contributionType as keyof typeof CONTRIBUTION_TYPE_FIELDS]
    : [];
  const visibleFields = [...COMMON_RESPONSE_FIELDS, ...typeFields];

  function setField(key: DesignResponseFieldKey, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function saveDraft(): Promise<boolean> {
    let ok = false;
    await saveState.run(async () => {
      const res = await authFetchJson(`/api/community/contributions/${contribution.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contributionType, explanation }),
      });
      if (!res.ok) throw new Error(typeof res.data.error === "string" ? res.data.error : "Could not save.");

      const responseBody: Record<string, string> = {};
      for (const f of visibleFields) responseBody[f.key] = fields[f.key];
      const res2 = await authFetchJson(`/api/community/contributions/${contribution.id}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseBody),
      });
      if (!res2.ok) throw new Error(typeof res2.data.error === "string" ? res2.data.error : "Could not save your response.");

      ok = true;
      setDirty(false);
    });
    return ok;
  }

  function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErrors({ title: "Give it a short title." });
      return;
    }
    setErrors({});
    saveDraft();
  }

  async function handleSubmit() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required.";
    if (!contributionType.trim()) next.contributionType = "Choose a contribution type.";
    if (!fields.problemStatement.trim()) next.problemStatement = "This is required before submitting.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    submitState.run(async () => {
      const savedOk = await saveDraft();
      if (!savedOk) throw new Error(saveState.error ?? "Could not save before submitting.");
      const res = await authFetchJson(`/api/community/contributions/${contribution.id}/submit`, { method: "POST" });
      if (!res.ok) throw new Error(typeof res.data.error === "string" ? res.data.error : "Could not submit.");
      setFinalStatus("submitted");
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-border bg-surface p-6">
        <p className="text-body text-ink">
          {finalStatus === "submitted" || contribution.status === "draft"
            ? "Your response has been submitted for review."
            : `This contribution's current status is "${contribution.status}".`}
        </p>
        <p className="text-caption mt-2 text-text-secondary">
          It&rsquo;s not public yet — a moderator reviews it before anything is published.
        </p>
        {initialMedia.length > 0 ? (
          <div className="mt-6">
            <ContributionMediaUploader contributionId={contribution.id} initialMedia={initialMedia} editable={false} />
          </div>
        ) : null}
        <Link href="/dashboard" className="text-caption mt-4 inline-block text-ink underline hover:text-accent">
          Back to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveDraft} noValidate className="flex flex-col gap-6">
      <FloatingLabelInput
        id="contrib-title"
        label="Title"
        type="text"
        value={title}
        onChange={(e) => markDirty(setTitle)(e.target.value)}
        error={errors.title}
        disabled={!editable}
        required
      />

      <div>
        <label htmlFor="contrib-type" className="text-caption text-text-secondary">
          Contribution type
        </label>
        <select
          id="contrib-type"
          value={contributionType}
          onChange={(e) => markDirty(setContributionType)(e.target.value)}
          disabled={!editable}
          className={`mt-1.5 ${selectClass}`}
        >
          <option value="">Select one</option>
          {CONTRIBUTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.contributionType ? <p className="mt-1 text-caption text-error">{errors.contributionType}</p> : null}
      </div>

      <div>
        <label htmlFor="contrib-explanation" className="text-caption text-text-secondary">
          Why you can help <span className="text-text-tertiary">(optional)</span>
        </label>
        <textarea
          id="contrib-explanation"
          value={explanation}
          onChange={(e) => markDirty(setExplanation)(e.target.value)}
          rows={2}
          disabled={!editable}
          className={`mt-1.5 ${textareaClass}`}
          placeholder="A short note to whoever's reviewing this — what draws you to this problem?"
        />
      </div>

      {contributionType ? (
        <div className="flex flex-col gap-4 rounded-md border border-border bg-background-alt p-4">
          <p className="text-label text-text-tertiary">{contributionType} details</p>
          {typeFields.map((f) => (
            <div key={f.key}>
              <label htmlFor={`resp-${f.key}`} className="text-caption text-text-secondary">
                {f.label}
              </label>
              {f.kind === "textarea" ? (
                <textarea
                  id={`resp-${f.key}`}
                  value={fields[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  rows={4}
                  disabled={!editable}
                  className={`mt-1.5 ${textareaClass}`}
                />
              ) : (
                <input
                  id={`resp-${f.key}`}
                  type={f.kind === "url" ? "url" : "text"}
                  value={fields[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  disabled={!editable}
                  placeholder={f.kind === "url" ? "https://…" : undefined}
                  className={`mt-1.5 ${inputClass}`}
                />
              )}
              {f.key === "problemStatement" && errors.problemStatement ? (
                <p className="mt-1 text-caption text-error">{errors.problemStatement}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-caption text-text-tertiary">Choose a contribution type above to see the relevant fields.</p>
      )}

      <div className="flex flex-col gap-4">
        <p className="text-label text-text-tertiary">Common to every response</p>
        {COMMON_RESPONSE_FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`resp-${f.key}`} className="text-caption text-text-secondary">
              {f.label} <span className="text-text-tertiary">(optional)</span>
            </label>
            {f.kind === "textarea" ? (
              <textarea
                id={`resp-${f.key}`}
                value={fields[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
                rows={3}
                disabled={!editable}
                className={`mt-1.5 ${textareaClass}`}
              />
            ) : (
              <input
                id={`resp-${f.key}`}
                type="text"
                value={fields[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
                disabled={!editable}
                className={`mt-1.5 ${inputClass}`}
              />
            )}
          </div>
        ))}
      </div>

      <ContributionMediaUploader contributionId={contribution.id} initialMedia={initialMedia} editable={editable} />

      {editable ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="secondary" disabled={saveState.isBusy || submitState.isBusy}>
            {saveState.isBusy ? "Saving…" : "Save draft"}
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={saveState.isBusy || submitState.isBusy}>
            {submitState.isBusy ? "Submitting…" : "Submit contribution"}
          </Button>
          {saveState.status === "saved" ? <span className="text-caption text-ink">✓ Draft saved</span> : null}
        </div>
      ) : null}

      {(saveState.status === "error" && saveState.error) || (submitState.status === "error" && submitState.error) ? (
        <p role="alert" className="text-caption text-error">
          {saveState.error || submitState.error}
        </p>
      ) : null}
    </form>
  );
}
