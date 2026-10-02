"use client";

import { AnimatePresence, motion } from "motion/react";
import { Copy, ExternalLink, Lock, MessageSquareText, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateFeedbackAction } from "@/app/hub/actions/feedback";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { Pill } from "@/components/ui/Pill";
import { Segmented } from "@/components/ui/Segmented";
import { StarRow } from "@/components/ui/Stars";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/components/ui/cn";
import { POST_STATUS_META, RECOMMEND_LABEL, SERVICE_LABEL, servicesLabel } from "@/lib/domain/labels";
import { SERVICES, type Feedback, type PostStatus } from "@/lib/domain/types";
import { formatDate } from "@/lib/util-client";
import { EmptyState } from "./Section";

type Filters = { q: string; client: string; rating: string; service: string; post: string; follow: string };

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="relative inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line bg-bg-2 pr-8 pl-3 text-[13px] transition hover:border-line-strong">
      <span className="text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="cursor-pointer appearance-none bg-transparent font-medium text-text outline-none">
        {children}
      </select>
      <svg className="pointer-events-none absolute right-2.5 size-3.5 text-muted" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </label>
  );
}

export function FeedbackView({ feedback, clients }: { feedback: Feedback[]; clients: { id: string; name: string }[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState<Filters>({ q: "", client: "", rating: "", service: "", post: params.get("post") ?? "", follow: params.get("follow") ?? "" });
  const selectedId = params.get("id");
  const selected = feedback.find((x) => x.id === selectedId) ?? null;

  const select = (id: string | null) => {
    const sp = new URLSearchParams(params);
    if (id) sp.set("id", id);
    else sp.delete("id");
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const rows = useMemo(() => {
    const term = f.q.trim().toLowerCase();
    return feedback.filter(
      (x) =>
        (!f.client || x.client_id === f.client) &&
        (!f.rating || (f.rating === "low" ? x.rating <= 3 : f.rating === "high" ? x.rating >= 4 : x.rating === Number(f.rating))) &&
        (!f.service || x.services.includes(f.service as Feedback["services"][number])) &&
        (!f.post || x.post_status === f.post) &&
        (!f.follow || x.follow_up === f.follow) &&
        (!term || [x.client_name, x.company, x.did_well, x.do_better, x.ref].some((v) => v?.toLowerCase().includes(term))),
    );
  }, [feedback, f]);

  const set = (k: keyof Filters) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const active = Object.entries(f).some(([k, v]) => k !== "q" && v);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-[240px]">
          <span className="sr-only">Search feedback</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input value={f.q} onChange={(e) => set("q")(e.target.value)} placeholder="Search feedback" className="field h-10 pl-9 text-sm" />
        </label>
        <FilterSelect label="Client" value={f.client} onChange={set("client")}>
          <option value="">All</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Rating" value={f.rating} onChange={set("rating")}>
          <option value="">All</option>
          <option value="high">4–5★</option>
          <option value="low">1–3★</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r}★
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Service" value={f.service} onChange={set("service")}>
          <option value="">All</option>
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_LABEL[s].en}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Post" value={f.post} onChange={set("post")}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="posted">Posted</option>
          <option value="not_for_post">Not for post</option>
        </FilterSelect>
        <FilterSelect label="Follow-up" value={f.follow} onChange={set("follow")}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
        </FilterSelect>
        {active && (
          <button onClick={() => setF({ q: f.q, client: "", rating: "", service: "", post: "", follow: "" })} className="inline-flex h-10 items-center gap-1 rounded-lg px-2 text-[13px] text-muted hover:text-text">
            <X className="size-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-line bg-bg-2">
                {["Date", "Client", "Service", "Rating", "Recommend", "Permission", "Follow-up", "Post"].map((h) => (
                  <th key={h} scope="col" className="label-mono px-4 py-3 font-medium text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((x, i) => (
                  <motion.tr
                    key={x.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.03 } }}
                    exit={{ opacity: 0 }}
                    onClick={() => select(x.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), select(x.id))}
                    tabIndex={0}
                    aria-label={`Open feedback ${x.ref} from ${x.client_name}`}
                    className={cn(
                      "cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-surface-2/50 focus-visible:bg-surface-2/60 focus-visible:outline-none",
                      selectedId === x.id && "bg-mint-soft/60 hover:bg-mint-soft/70",
                    )}
                  >
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap text-text-2">{formatDate(x.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar name={x.client_name} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-text">{x.client_name}</span>
                          <span className="block truncate text-[13px] text-muted">{x.company ?? "—"}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-2">{servicesLabel(x.services)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <StarRow value={x.rating} size={13} />
                        <span className="text-[13px] font-medium text-text tabular-nums">{x.rating}.0</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-2">{x.recommend ? RECOMMEND_LABEL[x.recommend] : "—"}</td>
                    <td className="px-4 py-3">
                      <Pill tone={x.public_permission ? "mint" : "neutral"} dot={false}>
                        {x.public_permission ? "Public" : "Private"}
                      </Pill>
                    </td>
                    <td className="px-4 py-3">
                      {x.follow_up ? <Pill tone={x.follow_up === "open" ? "error" : "neutral"}>{x.follow_up === "open" ? "Open" : "Done"}</Pill> : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={POST_STATUS_META[x.post_status].tone}>{POST_STATUS_META[x.post_status].label}</Pill>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <EmptyState
            icon={<MessageSquareText className="size-6" />}
            title={feedback.length ? "Nothing matches these filters" : "No feedback yet"}
            body={feedback.length ? "Clear a filter to see more." : "When a client answers their personal link, it shows up here and in the Google Sheet."}
          />
        )}
      </div>

      <Drawer open={Boolean(selected)} onClose={() => select(null)} label="Feedback detail">
        {selected && <FeedbackDetail key={selected.id + selected.updated_at} f={selected} onClose={() => select(null)} />}
      </Drawer>
    </div>
  );
}

function FeedbackDetail({ f, onClose }: { f: Feedback; onClose: () => void }) {
  const [post, setPost] = useState<PostStatus>(f.post_status);
  const [link, setLink] = useState(f.post_link ?? "");
  const [follow, setFollow] = useState(f.follow_up);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const dirty = post !== f.post_status || link !== (f.post_link ?? "") || follow !== f.follow_up;

  const quote = f.did_well ?? f.do_better ?? "";
  const copyQuote = async () => {
    const text = `“${quote}”\n— ${f.display_name ?? f.client_name}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Quote copied", "Paste it into your post design.");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const save = () =>
    start(async () => {
      const res = await updateFeedbackAction(f.id, { post_status: post, post_link: link, follow_up: follow ?? "none" });
      if (!res.ok) {
        setError(res.fieldErrors?.post_link ?? res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Saved", res.data.post_status !== f.post_status ? "The Google Sheet row updates through n8n." : undefined);
      router.refresh();
    });

  const section = "flex flex-col gap-2";
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-3 border-b border-line px-6 py-5">
        <div className="min-w-0 flex-1">
          <p className="label-mono text-muted">Feedback · {f.ref}</p>
          <p className="mt-0.5 text-[12.5px] text-muted">
            {formatDate(f.created_at, { year: true, time: true })} · personal link · {f.language === "bn" ? "বাংলা" : "English"}
          </p>
        </div>
        <button data-close onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg border border-line bg-surface-2 text-text-2 hover:text-text">
          <X className="size-4" />
        </button>
      </div>

      <div className="scrollbar-thin flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5 [&>*]:shrink-0">
        <Link href={`/hub/clients/${f.client_id}`} className="flex items-center gap-3 rounded-xl transition hover:opacity-90">
          <Avatar name={f.client_name} size={40} />
          <span>
            <span className="block font-display text-[18px] font-medium text-text">{f.client_name}</span>
            <span className="block text-[13px] text-muted">
              {[f.company, servicesLabel(f.services)].filter(Boolean).join(" · ")}
            </span>
          </span>
        </Link>

        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-bg-2">
          {(
            [
              ["Overall", f.rating, true],
              ["Communication", f.communication, false],
              ["Result & quality", f.result, false],
            ] as const
          ).map(([label, v, main]) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className={cn("text-[13px]", main ? "font-medium text-text" : "text-text-2")}>{label}</span>
              {v ? <StarRow value={v} size={main ? 20 : 14} /> : <span className="text-[13px] text-muted">—</span>}
            </div>
          ))}
        </div>

        {(
          [
            ["What did we do well?", f.did_well],
            ["What could we do better?", f.do_better],
          ] as const
        ).map(([label, v]) => (
          <div key={label} className={section}>
            <p className="text-[13px] text-muted">{label}</p>
            <p className={cn("text-[15px] leading-relaxed", v ? "text-text" : "text-muted")}>{v ? `“${v}”` : "No answer"}</p>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">Recommend</span>
          {f.recommend ? <Pill tone={f.recommend === "yes" ? "mint" : f.recommend === "maybe" ? "warning" : "error"}>{RECOMMEND_LABEL[f.recommend]}</Pill> : <span className="text-muted">—</span>}
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-line p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-text">Public permission</span>
            <Pill tone={f.public_permission ? "mint" : "neutral"}>{f.public_permission ? "Allowed" : "Not given"}</Pill>
          </div>
          {f.public_permission ? (
            <div className="flex items-center gap-3">
              {f.photo_file_id && (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded file served by /api/files
                <img src={`/api/files/${f.photo_file_id}`} alt="" className="size-10 rounded-full object-cover ring-1 ring-mint/30" />
              )}
              <p className="text-[13px] text-text-2">
                Show as <span className="text-text">“{f.display_name}”</span>
                {f.photo_file_id && (
                  <>
                    {" · "}
                    <a href={`/api/files/${f.photo_file_id}`} target="_blank" className="text-mint hover:underline">
                      photo / logo
                    </a>
                  </>
                )}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-muted">Keep this private. It can’t be posted.</p>
          )}
        </div>

        <div className={section}>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-text">Post status</span>
            {!f.public_permission && <Lock className="size-3.5 text-muted" aria-label="Locked: no permission" />}
          </div>
          <Segmented
            ariaLabel="Post status"
            value={post}
            onChange={(v) => {
              setPost(v);
              setError(null);
            }}
            disabled={!f.public_permission}
            options={[
              { value: "not_for_post", label: "Not for post" },
              { value: "pending", label: "Pending", activeClass: "text-warning" },
              { value: "posted", label: "Posted", activeClass: "text-mint" },
            ]}
          />
          <AnimatePresence initial={false}>
            {post !== "not_for_post" && f.public_permission && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <label htmlFor="post_link" className="mt-2 mb-1.5 block text-[13px] text-text-2">
                  Post link {post === "posted" ? "(required)" : "(when posted)"}
                </label>
                <div className="flex gap-2">
                  <input
                    id="post_link"
                    value={link}
                    onChange={(e) => {
                      setLink(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://facebook.com/…"
                    aria-invalid={error ? true : undefined}
                    className="field h-10 flex-1 text-sm"
                  />
                  {link && /^https?:\/\//.test(link) && (
                    <a href={link} target="_blank" rel="noopener noreferrer" aria-label="Open post" className="grid size-10 place-items-center rounded-[10px] border border-line bg-surface-2 text-text-2 hover:text-text">
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
                {error && <p className="mt-1.5 text-[13px] text-error">{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-[12px] text-muted">Saving updates this row in the Google Sheet (n8n · post.status_changed).</p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-line p-4">
          <div>
            <p className="text-[13px] font-medium text-text">Follow-up</p>
            <p className="text-[12px] text-muted">{f.follow_up ? (follow === "open" ? "Open · reach out within 24 hours" : "Done") : "Not needed (4–5★)"}</p>
          </div>
          {f.follow_up && <Toggle label="Follow-up done" checked={follow === "done"} onChange={(v) => setFollow(v ? "done" : "open")} />}
        </div>
      </div>

      <div className="flex gap-2.5 border-t border-line px-6 py-4">
        <Button variant="secondary" className="flex-1" icon={<Copy className="size-4" />} onClick={copyQuote} disabled={!quote}>
          Copy quote for post
        </Button>
        <Button variant="primary" className="flex-1" onClick={save} loading={pending} disabled={!dirty}>
          Save
        </Button>
      </div>
    </div>
  );
}
