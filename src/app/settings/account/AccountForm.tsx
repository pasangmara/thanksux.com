"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { FloatingLabelInput } from "@/components/experimental/FloatingLabelInput";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import { authFetchJson } from "@/lib/auth/authFetch";
import type { PublicProfile } from "@/types/publicProfile";

export function AccountForm({ profile }: { profile: PublicProfile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");
  const [nameError, setNameError] = useState<string | undefined>();
  const saveState = useSaveStatus();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Name cannot be empty.");
      return;
    }
    setNameError(undefined);

    saveState.run(async () => {
      const { ok, data } = await authFetchJson("/api/auth/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim() || null,
          bio: bio.trim() || null,
          website: website.trim() || null,
        }),
      });
      if (!ok) throw new Error(typeof data.error === "string" ? data.error : "Could not save your profile.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <FloatingLabelInput id="name" label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} error={nameError} required />
      <FloatingLabelInput id="username" label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} hint="Optional — @handle shown on your profile" />
      <FloatingLabelInput id="website" label="Website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} hint="Optional" />
      <div>
        <label htmlFor="bio" className="text-caption text-text-secondary">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink transition-colors duration-150 ease-out focus:border-accent focus:shadow-focus focus:outline-none"
        />
      </div>

      {saveState.status === "error" && saveState.error ? (
        <p role="alert" className="text-caption text-error">
          {saveState.error}
        </p>
      ) : null}
      {saveState.status === "saved" ? <p className="text-caption text-ink">✓ Saved</p> : null}

      <Button type="submit" variant="primary" disabled={saveState.isBusy} className="w-fit">
        {saveState.isBusy ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
