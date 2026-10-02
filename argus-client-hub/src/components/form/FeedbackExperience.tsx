"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, LockKeyhole, MessageCircleHeart } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { markOpenedAction, submitFeedbackAction } from "@/app/feedback/[code]/actions";
import { Logo } from "@/components/brand/Logo";
import { FounderAvatar } from "@/components/brand/FounderPhoto";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/components/ui/cn";
import { RatingInput } from "@/components/ui/Stars";
import { useToast } from "@/components/ui/Toast";
import type { DisplayMode, Lang, Recommend } from "@/lib/domain/types";
import { FORM_COPY, type FormCopy } from "@/lib/i18n/form";
import type { PublicBrand } from "@/lib/services/settings";
import { LangSwitch } from "./LangSwitch";
import { PhotoPicker } from "./PhotoPicker";
import { StatusView, ThankYouHigh, ThankYouLow } from "./Outcome";

export interface FormClient {
  firstName: string;
  name: string;
  company: string | null;
  serviceLabel: { en: string; bn: string };
  projectName: string | null;
  completed: { en: string | null; bn: string | null };
}

type Stage =
  | { kind: "form" }
  | { kind: "high"; displayName: string | null; rating: number }
  | { kind: "low" }
  | { kind: "used" }
  | { kind: "invalid" };

interface Draft {
  rating: number;
  communication: number;
  result: number;
  did_well: string;
  do_better: string;
  recommend: Recommend | "";
  permission: boolean;
  display_mode: DisplayMode;
}

const EMPTY: Draft = {
  rating: 0,
  communication: 0,
  result: 0,
  did_well: "",
  do_better: "",
  recommend: "",
  permission: false,
  display_mode: "name_company",
};

const LANG_KEY = "argus-lang";

const ease = [0.16, 1, 0.3, 1] as const;
const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.55, ease } }),
};

export function FeedbackExperience({
  code,
  initialState,
  initialLang,
  client,
  brand,
}: {
  code: string;
  initialState: "form" | "used" | "invalid";
  initialLang: Lang;
  client: FormClient | null;
  brand: PublicBrand;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [stage, setStage] = useState<Stage>({ kind: initialState } as Stage);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [shake, setShake] = useState(0);
  const [restored, setRestored] = useState(false);
  const ratingRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const c: FormCopy = FORM_COPY[lang];
  const draftKey = `argus-feedback-draft:${code}`;

  // Language: remembered per device, defaults to the client's preferred language.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      // localStorage only exists in the browser, so this must run after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "en" || saved === "bn") setLang(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const changeLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  };

  // Record "opened" once, and restore an unsent draft (closing the tab never loses answers).
  useEffect(() => {
    if (initialState !== "form") return;
    void markOpenedAction(code);
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        // Browser-only storage read after hydration (same reason as the language above).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft({ ...EMPTY, ...JSON.parse(raw) });
        setRestored(true);
      }
    } catch {}
  }, [code, draftKey, initialState]);
  useEffect(() => {
    if (stage.kind !== "form" || draft === EMPTY) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [draft, draftKey, stage.kind]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const progress = useMemo(() => {
    let p = draft.rating ? 40 : 0;
    if (draft.communication) p += 10;
    if (draft.result) p += 10;
    if (draft.did_well.trim()) p += 15;
    if (draft.do_better.trim()) p += 10;
    if (draft.recommend) p += 15;
    return Math.min(100, p);
  }, [draft]);

  const submit = () => {
    if (!draft.rating) {
      setShake((s) => s + 1);
      ratingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const fd = new FormData();
    fd.set("rating", String(draft.rating));
    fd.set("communication", String(draft.communication || ""));
    fd.set("result", String(draft.result || ""));
    fd.set("did_well", draft.did_well);
    fd.set("do_better", draft.do_better);
    fd.set("recommend", draft.recommend);
    fd.set("public_permission", draft.permission ? "true" : "false");
    fd.set("display_mode", draft.permission ? draft.display_mode : "");
    fd.set("language", lang);
    if (draft.permission && photo) fd.set("photo", photo);

    startTransition(async () => {
      try {
        const res = await submitFeedbackAction(code, fd);
        if (res.ok) {
          try {
            localStorage.removeItem(draftKey);
          } catch {}
          setStage(res.data.kind === "high" ? { kind: "high", displayName: res.data.displayName, rating: draft.rating } : { kind: "low" });
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (res.error.includes("already")) {
          setStage({ kind: "used" });
        } else {
          toast.error(res.error.includes("link") ? c.invalidTitle : c.error, res.fieldErrors?.photo);
        }
      } catch {
        toast.error(c.error);
      }
    });
  };

  return (
    <div className={cn("relative z-10 min-h-dvh overflow-x-clip", lang === "bn" && "lang-bn")}>
      {stage.kind === "form" && (
        <div className="fixed inset-x-0 top-0 z-30 h-[3px] bg-transparent" aria-hidden>
          <motion.div
            className="h-full bg-gradient-to-r from-deep via-mint to-mint shadow-[0_0_12px_rgba(43,242,161,0.7)]"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 24 }}
          />
        </div>
      )}

      <header className="relative z-20 mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 pt-5 lg:px-10 lg:pt-7">
        <a href="https://argusofficial.com" aria-label="ARGUS home" className="rounded-md">
          <Logo width={118} priority />
        </a>
        <LangSwitch lang={lang} onChange={changeLang} />
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={stage.kind}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease } }}
          exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
          className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pt-8 pb-14 lg:px-10 lg:pt-14"
        >
          {stage.kind === "form" && client && (
            <div className="grid gap-8 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-20">
              <Intro c={c} lang={lang} client={client} brand={brand} />
              <motion.form
                initial="hidden"
                animate="show"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className={cn(
                  "flex flex-col gap-8 transition-opacity duration-300 lg:rounded-[24px] lg:border lg:border-line lg:bg-surface/90 lg:p-10 lg:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] lg:backdrop-blur-xl",
                  pending && "pointer-events-none opacity-50",
                )}
                aria-busy={pending}
                noValidate
              >
                {restored && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="-mb-3 inline-flex items-center gap-2 self-start rounded-full bg-mint-soft px-3 py-1 text-[12.5px] text-mint"
                  >
                    <Check className="size-3.5" /> {c.draftSaved}
                  </motion.p>
                )}

                {/* Q1 overall */}
                <motion.section custom={0} variants={reveal} ref={ratingRef}>
                  <motion.div
                    key={shake}
                    animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
                    transition={{ type: "tween", duration: 0.45 }}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <h2 id="q-overall" className="text-[17px] leading-snug font-medium text-text">
                        {c.q1}
                      </h2>
                      <span className="mt-0.5 shrink-0 rounded-full bg-mint-soft px-2 py-0.5 text-[12px] text-mint">{c.required}</span>
                    </div>
                    <RatingInput
                      name="rating"
                      ariaLabel={c.q1}
                      value={draft.rating}
                      onChange={(v) => set("rating", v)}
                      labels={c.ratingWords}
                      invalid={shake > 0 && !draft.rating}
                    />
                  </motion.div>
                </motion.section>

                {/* Q2 quick scores */}
                <motion.section custom={1} variants={reveal}>
                  <p className={cn("mb-3 text-muted", lang === "en" ? "label-mono" : "text-[13px]")}>{c.q2}</p>
                  <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface lg:bg-bg-2">
                    {(
                      [
                        ["communication", c.communication],
                        ["result", c.result],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                        <span className="text-[15px] text-text">{label}</span>
                        <RatingInput name={key} ariaLabel={label} value={draft[key]} onChange={(v) => set(key, v)} size={26} gap={5} />
                      </div>
                    ))}
                  </div>
                </motion.section>

                {/* Q3, Q4 */}
                {(
                  [
                    ["did_well", c.didWell, 2],
                    ["do_better", c.doBetter, 3],
                  ] as const
                ).map(([key, label, i]) => (
                  <motion.section key={key} custom={i} variants={reveal}>
                    <div className="mb-2.5 flex items-baseline justify-between gap-3">
                      <label htmlFor={key} className="text-[15px] font-medium text-text">
                        {label}
                      </label>
                      <span className={cn("text-[12px] tabular-nums", draft[key].length > 900 ? "text-warning" : "text-muted")}>
                        {draft[key].length ? `${draft[key].length}/1000` : c.optional}
                      </span>
                    </div>
                    <textarea
                      id={key}
                      value={draft[key]}
                      maxLength={1000}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={c.placeholder}
                      rows={4}
                      className="field min-h-[112px] resize-none"
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
                      }}
                    />
                  </motion.section>
                ))}

                {/* Q5 recommend */}
                <motion.section custom={4} variants={reveal}>
                  <h2 id="q-rec" className="mb-3 text-[15px] font-medium text-text">
                    {c.recommend}
                  </h2>
                  <div role="radiogroup" aria-labelledby="q-rec" className="flex flex-wrap gap-2">
                    {(
                      [
                        ["yes", c.yes],
                        ["maybe", c.maybe],
                        ["no", c.no],
                      ] as const
                    ).map(([v, label]) => (
                      <Chip key={v} role="radio" selected={draft.recommend === v} onClick={() => set("recommend", draft.recommend === v ? "" : v)}>
                        {label}
                      </Chip>
                    ))}
                  </div>
                </motion.section>

                <div className="h-px bg-line" />

                {/* Public permission */}
                <motion.section custom={5} variants={reveal} className="flex flex-col gap-4">
                  <label className="group flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={draft.permission}
                      onChange={(e) => set("permission", e.target.checked)}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-md border-[1.5px] transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-mint peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg",
                        draft.permission ? "border-mint bg-mint text-on-mint" : "border-line-strong bg-bg-2 group-hover:border-muted",
                      )}
                    >
                      <AnimatePresence>
                        {draft.permission && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="size-3.5" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span>
                      <span className="block text-[15px] text-text">{c.permission}</span>
                      <span className="mt-1 block text-[13px] text-muted">{c.permissionHint}</span>
                    </span>
                  </label>

                  <AnimatePresence initial={false}>
                    {draft.permission && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2.5 pt-1 sm:pl-[34px]">
                          <p id="q-name" className="text-[15px] font-medium text-text">
                            {c.showName}
                          </p>
                          <div role="radiogroup" aria-labelledby="q-name" className="flex flex-col gap-2">
                            {(
                              [
                                ["name_company", c.nameCompany, client.company ? `${client.name}, ${client.company}` : client.name],
                                ["first_name", c.firstOnly, client.firstName],
                                ["anonymous", c.anonymous, c.anonymousHint],
                              ] as const
                            ).map(([v, label, hint]) => {
                              const on = draft.display_mode === v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  role="radio"
                                  aria-checked={on}
                                  onClick={() => set("display_mode", v)}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150",
                                    on ? "border-mint bg-mint-soft" : "border-line bg-bg-2 hover:border-line-strong",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]",
                                      on ? "border-mint" : "border-line-strong",
                                    )}
                                  >
                                    {on && <motion.span layoutId="name-dot" className="size-2.5 rounded-full bg-mint" />}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[15px] font-medium text-text">{label}</span>
                                    <span className="block truncate text-[13px] text-muted">{hint}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="pt-1">
                            <PhotoPicker file={photo} onChange={setPhoto} copy={c} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>

                {/* Submit */}
                <motion.div custom={6} variants={reveal} className="flex flex-col items-center gap-2.5">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className={cn("w-full", !draft.rating && "opacity-55 shadow-none")}
                    loading={pending}
                    aria-disabled={!draft.rating}
                  >
                    {pending ? c.sending : c.send}
                  </Button>
                  <p className="text-[13px] text-muted" aria-live="polite">
                    {pending ? c.keepOpen : !draft.rating ? c.hint : " "}
                  </p>
                </motion.div>

                <footer className="flex flex-col items-center gap-1.5 pt-1 text-center">
                  <p className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                    <LockKeyhole className="size-3.5" /> {c.foot}
                  </p>
                  <p className="font-mono text-[12px] text-muted/80">argusofficial.com</p>
                </footer>
              </motion.form>
            </div>
          )}

          {stage.kind === "high" && client && (
            <ThankYouHigh c={c} brand={brand} client={client} rating={stage.rating} displayName={stage.displayName} lang={lang} />
          )}
          {stage.kind === "low" && client && <ThankYouLow c={c} brand={brand} lang={lang} />}
          {(stage.kind === "used" || stage.kind === "invalid") && (
            <StatusView c={c} brand={brand} kind={stage.kind} firstName={client?.firstName} />
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

function Intro({ c, lang, client, brand }: { c: FormCopy; lang: Lang; client: FormClient; brand: PublicBrand }) {
  const company = client.company ?? client.name;
  return (
    <motion.aside initial="hidden" animate="show" className="flex flex-col gap-7 lg:sticky lg:top-12 lg:self-start">
      <motion.div custom={0} variants={reveal} className="flex flex-col gap-3">
        <p className={cn("text-mint", lang === "en" ? "label-mono" : "text-[13px] font-semibold")}>{c.label}</p>
        <h1 className="font-display text-[30px] leading-[1.12] font-bold tracking-[-0.01em] text-text sm:text-[34px] lg:text-[46px] lg:leading-[1.05]">
          {c.title(client.firstName)}
        </h1>
        <p className="text-[15px] leading-relaxed text-text-2 lg:text-[18px]">
          <span className="lg:hidden">{c.intro(company)}</span>
          <span className="hidden lg:inline">{c.introDesktop(company)}</span>
        </p>
      </motion.div>

      <motion.div
        custom={1}
        variants={reveal}
        className="relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-mint/30 bg-gradient-to-r from-mint-soft/95 to-surface/90 p-4"
      >
        <FounderAvatar src={brand.avatarUrl} size={52} />
        <div className="min-w-0">
          <p className="text-[14px] leading-snug text-text">“{brand.note[lang]}”</p>
          <p className="mt-1 text-[13px] font-medium text-mint">
            — {lang === "bn" ? "জয় হাওলাদার, ফাউন্ডার" : `${brand.founderName}, Founder`}
          </p>
        </div>
      </motion.div>

      <motion.div custom={2} variants={reveal} className="card flex flex-col gap-2 p-4">
        <p className={cn("text-muted", lang === "en" ? "label-mono" : "text-[12px]")}>{c.project}</p>
        <p className="text-[15px] font-medium text-text">{client.projectName || client.serviceLabel[lang]}</p>
        <p className="text-[13px] text-muted">
          {client.company ?? client.name}
          {client.completed[lang] ? ` · ${c.completed(client.completed[lang]!)}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-mint bg-mint-soft px-3 text-[13px] font-medium text-mint">
            <Check className="size-3.5" strokeWidth={2.5} /> {client.serviceLabel[lang]}
          </span>
          <span className="text-[13px] text-muted">{c.prefilled}</span>
        </div>
      </motion.div>

      <motion.ul custom={3} variants={reveal} className="hidden flex-col gap-3 lg:flex">
        {c.points.map((p, i) => (
          <li key={p} className="flex items-center gap-3 text-[15px] text-text-2">
            <span className="grid size-8 place-items-center rounded-lg bg-mint-soft text-mint">
              {i === 0 ? <Check className="size-4" /> : i === 1 ? <LockKeyhole className="size-4" /> : <MessageCircleHeart className="size-4" />}
            </span>
            {p}
          </li>
        ))}
      </motion.ul>
    </motion.aside>
  );
}
