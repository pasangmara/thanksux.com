"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteClientAction, logContactAction, regenerateLinkAction, saveNotesAction, setStatusAction } from "@/app/hub/actions/clients";
import { updateFeedbackAction } from "@/app/hub/actions/feedback";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/components/ui/cn";
import { CLIENT_STATUS_META } from "@/lib/domain/labels";
import { CLIENT_STATUSES, type ClientStatus, type Feedback } from "@/lib/domain/types";

export function StatusSelect({ id, status }: { id: string; status: ClientStatus }) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Client status</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as ClientStatus;
          const prev = value;
          setValue(next); // optimistic
          start(async () => {
            const res = await setStatusAction(id, next);
            if (res.ok) toast.success(`Status → ${CLIENT_STATUS_META[next].label}`);
            else {
              setValue(prev);
              toast.error(res.error);
            }
          });
        }}
        className={cn(
          "h-7 cursor-pointer appearance-none rounded-full border-0 py-0 pr-7 pl-3 text-[12.5px] font-medium outline-offset-2",
          {
            info: "bg-info-soft text-info",
            mint: "bg-mint-soft text-mint",
            neutral: "bg-surface-2 text-text-2",
            warning: "bg-warning-soft text-warning",
            error: "bg-error-soft text-error",
          }[CLIENT_STATUS_META[value].tone],
        )}
      >
        {CLIENT_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-surface text-text">
            {CLIENT_STATUS_META[s].label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2 size-3.5 opacity-70" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </label>
  );
}

/** Autosaves 800 ms after typing stops. */
export function NotesEditor({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setState("saving");
    const t = setTimeout(async () => {
      const res = await saveNotesAction(id, value);
      setState(res.ok ? "saved" : "error");
    }, 800);
    return () => clearTimeout(t);
  }, [id, value]);
  return (
    <div className="flex flex-1 flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Preferences, next opportunities, anything the team should remember…"
        aria-label="Private notes"
        className="field min-h-[140px] flex-1 resize-none text-[14px]"
        maxLength={4000}
      />
      <p className="h-4 text-[12px] text-muted" aria-live="polite">
        {state === "saving" ? "Saving…" : state === "saved" ? "✓ Saved · only the ARGUS team can see notes" : state === "error" ? "Couldn't save. Check your connection." : "Only the ARGUS team can see notes."}
      </p>
    </div>
  );
}

export function ContactLogForm({ id }: { id: string }) {
  const [kind, setKind] = useState("call");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("kind", kind);
        fd.set("note", note);
        start(async () => {
          const res = await logContactAction(id, fd);
          if (res.ok) {
            setNote("");
            toast.success("Added to timeline");
            router.refresh();
          } else toast.error(res.fieldErrors?.note ?? res.error);
        });
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Contact type" className="field h-10 w-full py-0 text-sm sm:w-[130px]">
        <option value="call">Call</option>
        <option value="whatsapp">WhatsApp</option>
        <option value="email">Email</option>
        <option value="meeting">Meeting</option>
      </select>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened? e.g. Called, will add weekly updates" aria-label="Note" className="field h-10 flex-1 text-sm" maxLength={500} />
      <Button type="submit" variant="secondary" loading={pending} disabled={note.trim().length < 2}>
        Log
      </Button>
    </form>
  );
}

export function RegenerateLinkButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <Button variant="ghost" size="sm" icon={<RefreshCw className="size-3.5" />} onClick={() => setOpen(true)}>
        New link
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create a new feedback link?" width={460}>
        <p className="text-[14px] text-text-2">Use this when the client starts a new project. The current link stops working, and the new one can collect one more feedback.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await regenerateLinkAction(id);
                if (res.ok) {
                  toast.success("New link ready");
                  setOpen(false);
                  router.refresh();
                } else toast.error(res.error);
              })
            }
          >
            Create new link
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <Button variant="ghost" size="sm" className="text-muted hover:text-error" icon={<Trash2 className="size-3.5" />} onClick={() => setOpen(true)}>
        Delete client
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete this client?" width={460}>
        <p className="text-[14px] text-text-2">
          This removes <strong className="text-text">{name}</strong>, their feedback and timeline from the dashboard. Rows already in the Google Sheet stay. This can’t be undone.
        </p>
        <label className="mt-4 block text-[13px] text-muted">
          Type <span className="font-medium text-text">{name}</span> to confirm
          <input value={typed} onChange={(e) => setTyped(e.target.value)} className="field mt-2 h-10 text-sm" autoComplete="off" />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            disabled={typed.trim() !== name}
            onClick={() =>
              start(async () => {
                const res = await deleteClientAction(id, typed);
                if (res.ok) {
                  toast.success("Client deleted");
                  router.push("/hub/clients");
                } else toast.error(res.error);
              })
            }
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function FollowUpButton({ feedback }: { feedback: Feedback }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const open = feedback.follow_up === "open";
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={String(open)} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
        <Button
          variant={open ? "secondary" : "ghost"}
          size="sm"
          loading={pending}
          icon={open ? <Check className="size-3.5" /> : undefined}
          onClick={() =>
            start(async () => {
              const res = await updateFeedbackAction(feedback.id, {
                post_status: feedback.post_status,
                post_link: feedback.post_link ?? "",
                follow_up: open ? "done" : "open",
              });
              if (res.ok) {
                toast.success(open ? "Follow-up marked done" : "Follow-up reopened");
                router.refresh();
              } else toast.error(res.error);
            })
          }
        >
          {open ? "Mark follow-up done" : "Reopen follow-up"}
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
