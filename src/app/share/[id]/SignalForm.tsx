"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { FloatingLabelInput } from "@/components/experimental/FloatingLabelInput";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import { authFetchJson } from "@/lib/auth/authFetch";
import { THANKS_SIGNAL_CATEGORIES } from "@/types/thanksSignal";
import type { ThanksSignal } from "@/types/thanksSignal";
import { SignalMediaUploader, type SignalMediaItem } from "./SignalMediaUploader";

const MAX_DESCRIPTION = 4000;

const selectClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink transition-colors duration-150 ease-out focus:border-accent focus:shadow-focus focus:outline-none";
const textareaClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink transition-colors duration-150 ease-out focus:border-accent focus:shadow-focus focus:outline-none";

export function SignalForm({
  signal,
  editable,
  initialMedia,
}: {
  signal: ThanksSignal;
  editable: boolean;
  initialMedia: SignalMediaItem[];
}) {
  const [title, setTitle] = useState(signal.title);
  const [description, setDescription] = useState(signal.description);
  const [category, setCategory] = useState(signal.category ?? "");
  const [context, setContext] = useState(signal.context ?? "");
  const [audience, setAudience] = useState(signal.audience ?? "");
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(signal.status !== "draft");
  const saveState = useSaveStatus();
  const submitState = useSaveStatus();

  // Unsaved-changes protection — only while there's genuinely something
  // that hasn't been saved yet, never a blanket "always warn."
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

  async function saveDraft(): Promise<boolean> {
    let ok = false;
    await saveState.run(async () => {
      const res = await authFetchJson(`/api/community/signals/${signal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, context, audience }),
      });
      if (!res.ok) throw new Error(typeof res.data.error === "string" ? res.data.error : "Could not save your draft.");
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
    if (!description.trim()) next.description = "Description is required.";
    if (!category.trim()) next.category = "Choose a category.";
    if (!context.trim()) next.context = "Add a little context.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    submitState.run(async () => {
      const savedOk = await saveDraft();
      if (!savedOk) throw new Error(saveState.error ?? "Could not save before submitting.");
      const res = await authFetchJson(`/api/community/signals/${signal.id}/submit`, { method: "POST" });
      if (!res.ok) throw new Error(typeof res.data.error === "string" ? res.data.error : "Could not submit.");
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-border bg-surface p-6">
        <p className="text-body text-ink">
          {signal.status === "draft"
            ? "Your ThanksSignal has been submitted for review."
            : `This signal's current status is "${signal.status}".`}
        </p>
        <p className="text-caption mt-2 text-text-secondary">
          It&rsquo;s not public yet — the design community will see it once it&rsquo;s reviewed.
        </p>
        <Link href="/dashboard" className="text-caption mt-4 inline-block text-ink underline hover:text-accent">
          Back to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveDraft} noValidate className="flex flex-col gap-6">
      <FloatingLabelInput
        id="title"
        label="Title"
        type="text"
        value={title}
        onChange={(e) => markDirty(setTitle)(e.target.value)}
        error={errors.title}
        disabled={!editable}
        required
      />

      <div>
        <label htmlFor="description" className="text-caption text-text-secondary">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => markDirty(setDescription)(e.target.value)}
          rows={5}
          maxLength={MAX_DESCRIPTION}
          disabled={!editable}
          className={`mt-1.5 ${textareaClass}`}
          placeholder="What happened? What made it confusing or frustrating?"
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.description ? <p className="text-caption text-error">{errors.description}</p> : <span />}
          <p className="text-caption text-text-tertiary">
            {description.length}/{MAX_DESCRIPTION}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="category" className="text-caption text-text-secondary">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => markDirty(setCategory)(e.target.value)}
          disabled={!editable}
          className={`mt-1.5 ${selectClass}`}
        >
          <option value="">Select one</option>
          {THANKS_SIGNAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.category ? <p className="mt-1 text-caption text-error">{errors.category}</p> : null}
      </div>

      <div>
        <label htmlFor="context" className="text-caption text-text-secondary">
          Context
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => markDirty(setContext)(e.target.value)}
          rows={3}
          disabled={!editable}
          className={`mt-1.5 ${textareaClass}`}
          placeholder="When or where this happened — e.g. “booking online, late at night, on mobile”"
        />
        {errors.context ? <p className="mt-1 text-caption text-error">{errors.context}</p> : null}
      </div>

      <FloatingLabelInput
        id="audience"
        label="Audience"
        type="text"
        value={audience}
        onChange={(e) => markDirty(setAudience)(e.target.value)}
        disabled={!editable}
        hint="Optional — who else might run into this?"
      />

      <SignalMediaUploader signalId={signal.id} initialMedia={initialMedia} editable={editable} />

      {editable ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="secondary" disabled={saveState.isBusy || submitState.isBusy}>
            {saveState.isBusy ? "Saving…" : "Save draft"}
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={saveState.isBusy || submitState.isBusy}>
            {submitState.isBusy ? "Submitting…" : "Submit for review"}
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
