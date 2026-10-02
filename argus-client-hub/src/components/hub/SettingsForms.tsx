"use client";

import { AnimatePresence, motion } from "motion/react";
import { Copy, KeyRound, RefreshCw, Send, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  changePasswordAction,
  generateSecretAction,
  retryEventAction,
  saveBrandingAction,
  saveContactAction,
  saveIntegrationsAction,
  saveNotificationsAction,
  saveReviewLinksAction,
  sendPendingAction,
  sendTestEventAction,
} from "@/app/hub/actions/settings";
import { addMemberAction, removeMemberAction } from "@/app/hub/actions/team";
import { FounderAvatar } from "@/components/brand/FounderPhoto";
import { PhotoPicker } from "@/components/form/PhotoPicker";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { Pill } from "@/components/ui/Pill";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/components/ui/cn";
import type { ActionResult } from "@/lib/actions-types";
import { EVENT_NAMES, type EventName, type OutboxEvent, type PublicMember } from "@/lib/domain/types";
import { formatDate, timeAgo } from "@/lib/util-client";

/** Shared submit helper: runs a server action, shows a toast, keeps field errors. */
function useSave<T>() {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();
  const save = (fn: () => Promise<ActionResult<T>>, onOk?: (data: T) => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        setErrors({});
        toast.success(res.message ?? "Saved");
        onOk?.(res.data);
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  return { pending, errors, save };
}

const submitWith =
  (handler: (fd: FormData) => void) =>
  (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handler(new FormData(e.currentTarget));
  };

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-3 first:border-0">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-text">{label}</p>
        {hint && <p className="text-[12.5px] text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const EVENT_HELP: Record<EventName, string> = {
  "feedback.created": "New feedback → Sheet row + WhatsApp/email (urgent if ≤ 3★)",
  "post.status_changed": "Pending / Posted changed → update the Sheet row",
  "followup.changed": "Follow-up marked done or reopened",
  "client.created": "A client was added",
  "client.link_sent": "A feedback link was sent",
  "reminder.due": "Daily 10:00: finished projects with no feedback yet",
  "test.ping": "Test button below",
};

/* ───────────────────────── n8n + Sheet ───────────────────────── */

export function IntegrationsForm({
  webhookUrl,
  hasSecret,
  fromEnv,
  sheetUrl,
  events,
  connected,
  recent,
  waiting,
}: {
  webhookUrl: string;
  hasSecret: boolean;
  fromEnv: { url: boolean; secret: boolean };
  sheetUrl: string;
  events: Record<EventName, boolean>;
  connected: boolean;
  recent: OutboxEvent[];
  waiting: number;
}) {
  const { pending, errors, save } = useSave<undefined>();
  const [enabled, setEnabled] = useState(events);
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const act = <T,>(fn: () => Promise<ActionResult<T>>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message ?? "Done");
      else toast.error(res.error);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={submitWith((fd) => save(() => saveIntegrationsAction(fd)))}
        className="flex flex-col gap-4"
      >
        <TextField
          label="n8n webhook URL"
          name="webhook_url"
          defaultValue={webhookUrl}
          placeholder="https://your-n8n.app/webhook/argus-feedback"
          error={errors.webhook_url}
          disabled={fromEnv.url}
          hint={fromEnv.url ? "Set by N8N_WEBHOOK_URL" : "Production URL of a Webhook node (POST)"}
        />
        <div>
          <TextField
            label="Signing secret"
            name="secret"
            type="password"
            placeholder={hasSecret ? "•••••••••••• saved. Leave empty to keep it." : "Optional, but recommended"}
            disabled={fromEnv.secret}
            hint={fromEnv.secret ? "Set by N8N_WEBHOOK_SECRET" : "n8n checks the X-Argus-Signature header with it"}
            autoComplete="new-password"
          />
          {!fromEnv.secret && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                icon={<KeyRound className="size-3.5" />}
                loading={busy}
                onClick={() =>
                  start(async () => {
                    const res = await generateSecretAction();
                    if (res.ok) {
                      setSecret(res.data);
                      toast.success("New secret created", "Copy it into n8n now. It won't be shown again.");
                    } else toast.error(res.error);
                  })
                }
              >
                Generate a secret
              </Button>
              <AnimatePresence>
                {secret && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => navigator.clipboard.writeText(secret).then(() => toast.success("Secret copied"))}
                    className="inline-flex items-center gap-2 rounded-lg border border-mint/40 bg-mint-soft px-2.5 py-1 font-mono text-[12px] text-mint"
                  >
                    {secret} <Copy className="size-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        <TextField
          label="Google Sheet link"
          name="sheet_url"
          defaultValue={sheetUrl}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          error={errors.sheet_url}
          hint="For the “Open Google Sheet” button. n8n writes the rows."
        />
        <div>
          <p className="mb-1 text-[14px] font-medium text-text">Events sent to n8n</p>
          <div className="rounded-xl border border-line px-4">
            {EVENT_NAMES.filter((e) => e !== "test.ping").map((e) => (
              <Row key={e} label={e} hint={EVENT_HELP[e]}>
                <Toggle label={e} name={`event:${e}`} checked={enabled[e]} onChange={(v) => setEnabled((s) => ({ ...s, [e]: v }))} />
              </Row>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" icon={<Send className="size-4" />} loading={busy} disabled={!connected} onClick={() => act(sendTestEventAction)}>
            Send test event
          </Button>
          <Button type="submit" variant="primary" loading={pending}>
            Save
          </Button>
        </div>
      </form>

      <div className="border-t border-line pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[14px] font-medium text-text">Event log</p>
            <p className="text-[12.5px] text-muted">
              {connected
                ? waiting
                  ? `${waiting} waiting. They retry automatically (cron) or send them now.`
                  : "Everything is delivered."
                : "Not connected yet. Events are saved and wait here until n8n is added."}
            </p>
          </div>
          <Button size="sm" variant="secondary" icon={<RefreshCw className="size-3.5" />} disabled={!connected || !waiting} loading={busy} onClick={() => act(sendPendingAction)}>
            Send pending events
          </Button>
        </div>
        {recent.length === 0 ? (
          <p className="text-[13px] text-muted">No events yet.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {recent.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="font-mono text-[12.5px] text-text">{e.event}</span>
                <Pill tone={e.status === "sent" ? "mint" : e.status === "failed" ? "error" : e.status === "skipped" ? "neutral" : "warning"}>
                  {e.status === "pending" && !connected ? "waiting" : e.status}
                </Pill>
                <span className="min-w-0 flex-1 truncate text-[12px] text-muted" title={e.last_error ?? undefined}>
                  {e.last_error ?? (e.sent_at ? `sent ${timeAgo(e.sent_at)}` : formatDate(e.created_at, { time: true }))}
                </span>
                {e.status === "failed" && connected && (
                  <Button size="sm" variant="ghost" onClick={() => act(() => retryEventAction(e.id))}>
                    Retry
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Notifications ───────────────────────── */

export function NotificationsForm({
  notify,
  days,
}: {
  notify: { whatsapp: string; email: string; new_feedback: boolean; low_rating: boolean; daily_reminder: boolean; post_status: boolean };
  days: number;
}) {
  const { pending, errors, save } = useSave<undefined>();
  const [t, setT] = useState(notify);
  return (
    <form onSubmit={submitWith((fd) => save(() => saveNotificationsAction(fd)))} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="WhatsApp (team)" name="whatsapp" defaultValue={notify.whatsapp} error={errors.whatsapp} />
        <TextField label="Email (team)" name="email" type="email" defaultValue={notify.email} error={errors.email} />
      </div>
      <div className="rounded-xl border border-line px-4">
        {(
          [
            ["new_feedback", "New feedback", "WhatsApp + email"],
            ["low_rating", "Low rating (1–3★)", "Urgent · WhatsApp + email"],
            ["daily_reminder", "Daily reminder · 10:00", "Clients with no feedback"],
            ["post_status", "Post status changed", "Email only"],
          ] as const
        ).map(([k, label, hint]) => (
          <Row key={k} label={label} hint={hint}>
            <Toggle label={label} name={k} checked={t[k]} onChange={(v) => setT((s) => ({ ...s, [k]: v }))} />
          </Row>
        ))}
        <Row label="Reminder after" hint="Days after a project is completed">
          <select name="days_after_completion" defaultValue={days} className="field h-9 w-24 py-0 text-sm">
            {[1, 2, 3, 5, 7, 10, 14].map((d) => (
              <option key={d} value={d}>
                {d} day{d > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </Row>
      </div>
      <p className="text-[12.5px] text-muted">The app sends these settings to n8n with every event. n8n does the actual WhatsApp/email sending.</p>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}

/* ───────────────────────── Review links + public contact ───────────────────────── */

export function ReviewLinksForm({ facebook, google }: { facebook: string; google: string }) {
  const { pending, errors, save } = useSave<undefined>();
  return (
    <form onSubmit={submitWith((fd) => save(() => saveReviewLinksAction(fd)))} className="flex flex-col gap-4">
      <TextField label="Facebook review link" name="facebook" defaultValue={facebook} error={errors.facebook} />
      <TextField
        label="Google review link"
        name="google"
        defaultValue={google}
        error={errors.google}
        placeholder="Add later. The button stays hidden until then."
      />
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}

export function ContactForm({ whatsapp, email }: { whatsapp: string; email: string }) {
  const { pending, errors, save } = useSave<undefined>();
  return (
    <form onSubmit={submitWith((fd) => save(() => saveContactAction(fd)))} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="WhatsApp shown to clients" name="whatsapp" defaultValue={whatsapp} error={errors.whatsapp} />
        <TextField label="Email shown to clients" name="email" type="email" defaultValue={email} error={errors.email} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}

/* ───────────────────────── Form branding ───────────────────────── */

const photoCopy = {
  addPhoto: "Choose photo",
  photoHint: "JPG, PNG or WEBP · up to 5 MB · 1200×1200 or bigger",
  photoShown: "Ready to save",
  remove: "Remove",
  photoTooBig: "Image must be 5 MB or smaller.",
  photoType: "Please choose a JPG, PNG or WEBP image.",
};

export function BrandingForm({
  brand,
  photoUrl,
  avatarUrl,
  customPhotos,
}: {
  brand: { founder_name: string; founder_role: string; note_en: string; note_bn: string; thanks_en: string; thanks_bn: string };
  photoUrl: string;
  avatarUrl: string;
  customPhotos: boolean;
}) {
  const { pending, errors, save } = useSave<undefined>();
  const [photo, setPhoto] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  return (
    <form
      onSubmit={submitWith((fd) => {
        if (photo) fd.set("photo", photo);
        if (avatar) fd.set("avatar", avatar);
        save(() => saveBrandingAction(fd), () => {
          setPhoto(null);
          setAvatar(null);
        });
      })}
      className="flex flex-col gap-5"
    >
      <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- live preview of the saved photo */}
        <img src={photoUrl} alt="Current thank-you photo" className="aspect-[8/7] w-full rounded-2xl border border-mint/30 object-cover object-[60%_30%]" />
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[14px] font-medium text-text">Thank-you photo</p>
            <p className="mb-2 text-[12.5px] text-muted">The big photo on the 4–5★ thank-you page. Face on the right side looks best.</p>
            <PhotoPicker file={photo} onChange={setPhoto} copy={photoCopy} label="Change thank-you photo" />
          </div>
          <div className="flex items-center gap-3">
            <FounderAvatar src={avatarUrl} size={48} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-text">Round photo</p>
              <p className="text-[12.5px] text-muted">Used in the note at the top of the form and on the 1–3★ page.</p>
            </div>
          </div>
          <PhotoPicker file={avatar} onChange={setAvatar} copy={photoCopy} label="Change round photo" />
          {customPhotos && (
            <label className="flex items-center gap-2 text-[13px] text-muted">
              <input type="checkbox" name="reset_photos" value="true" className="accent-[#2bf2a1]" /> Go back to the default ARGUS photos
            </label>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" name="founder_name" defaultValue={brand.founder_name} error={errors.founder_name} />
        <TextField label="Role" name="founder_role" defaultValue={brand.founder_role} error={errors.founder_role} />
        <TextArea label="Note at the top · English" name="note_en" defaultValue={brand.note_en} error={errors.note_en} rows={3} maxLength={220} />
        <TextArea label="Note at the top · বাংলা" name="note_bn" defaultValue={brand.note_bn} error={errors.note_bn} rows={3} maxLength={220} className="lang-bn" />
        <TextArea label="Thank-you message · English" name="thanks_en" defaultValue={brand.thanks_en} error={errors.thanks_en} rows={3} maxLength={300} />
        <TextArea label="Thank-you message · বাংলা" name="thanks_bn" defaultValue={brand.thanks_bn} error={errors.thanks_bn} rows={3} maxLength={300} className="lang-bn" />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="text-[13px] text-muted">Tip: open any client’s feedback link to see it live.</p>
        <Button type="submit" variant="primary" loading={pending}>
          Save branding
        </Button>
      </div>
    </form>
  );
}

/* ───────────────────────── Team ───────────────────────── */

export function TeamPanel({ members, me }: { members: PublicMember[]; me: PublicMember }) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ member: PublicMember; password: string } | null>(null);
  const { pending, errors, save } = useSave<{ member: PublicMember; password: string }>();
  const [busy, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={m.name} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-text">
                {m.name} {m.id === me.id && <span className="text-muted">(you)</span>}
              </p>
              <p className="truncate text-[12.5px] text-muted">
                {m.email} · {m.last_login_at ? `last seen ${timeAgo(m.last_login_at)}` : "never signed in"}
              </p>
            </div>
            <Pill tone={m.role === "admin" ? "mint" : "neutral"} dot={false}>
              {m.role === "admin" ? "Admin" : "Staff"}
            </Pill>
            {m.id !== me.id && (
              <button
                aria-label={`Remove ${m.name}`}
                disabled={busy}
                onClick={() => {
                  if (!confirm(`Remove ${m.name} from the team?`)) return;
                  start(async () => {
                    const res = await removeMemberAction(m.id);
                    if (res.ok) toast.success("Member removed");
                    else toast.error(res.error);
                    router.refresh();
                  });
                }}
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-error-soft hover:text-error"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-[12.5px] text-muted">Admin: everything. Staff: clients and feedback, no settings.</p>
      <div>
        <Button variant="secondary" icon={<UserPlus className="size-4" />} onClick={() => setOpen(true)}>
          Invite member
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setTimeout(() => setCreated(null), 250);
        }}
        title={created ? "Member added" : "Invite a team member"}
        width={480}
      >
        {created ? (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] text-text-2">
              Send these to <span className="text-text">{created.member.name}</span>. The password is shown only once. They can change it in Settings → My account.
            </p>
            <div className="rounded-xl border border-line bg-bg-2 p-4 font-mono text-[13px] text-text">
              <p>{created.member.email}</p>
              <p className="mt-1 text-mint">{created.password}</p>
            </div>
            <Button
              variant="primary"
              icon={<Copy className="size-4" />}
              onClick={() =>
                navigator.clipboard
                  .writeText(`ARGUS Client Hub\n${location.origin}/hub/login\nEmail: ${created.member.email}\nPassword: ${created.password}`)
                  .then(() => toast.success("Copied"))
              }
            >
              Copy login details
            </Button>
          </div>
        ) : (
          <form onSubmit={submitWith((fd) => save(() => addMemberAction(fd), (d) => setCreated(d)))} className="flex flex-col gap-4">
            <TextField label="Name" name="name" error={errors.name} />
            <TextField label="Email" name="email" type="email" error={errors.email} />
            <SelectField label="Role" name="role" defaultValue="staff">
              <option value="staff">Staff · clients and feedback</option>
              <option value="admin">Admin · everything</option>
            </SelectField>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={pending}>
                Add member
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ───────────────────────── My account ───────────────────────── */

export function PasswordForm() {
  const { pending, errors, save } = useSave<undefined>();
  const [key, setKey] = useState(0);
  return (
    <form key={key} onSubmit={submitWith((fd) => save(() => changePasswordAction(fd), () => setKey((k) => k + 1)))} className={cn("grid gap-4 sm:grid-cols-3")}>
      <TextField label="Current password" name="current" type="password" autoComplete="current-password" error={errors.current} />
      <TextField label="New password" name="next" type="password" autoComplete="new-password" error={errors.next} placeholder="10+ characters" />
      <TextField label="Repeat new password" name="confirm" type="password" autoComplete="new-password" error={errors.confirm} />
      <div className="flex justify-end sm:col-span-3">
        <Button type="submit" variant="secondary" loading={pending}>
          Change password
        </Button>
      </div>
    </form>
  );
}
