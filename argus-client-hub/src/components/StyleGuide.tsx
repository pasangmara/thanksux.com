"use client";

import { Check, Copy, Plus, Send } from "lucide-react";
import { useState } from "react";
import { FounderAvatar, FounderCard } from "@/components/brand/FounderPhoto";
import { Logo } from "@/components/brand/Logo";
import { LangSwitch } from "@/components/form/LangSwitch";
import { PhotoPicker } from "@/components/form/PhotoPicker";
import { Kpi } from "@/components/hub/Kpi";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextArea, TextField, SelectField } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Segmented } from "@/components/ui/Segmented";
import { RatingInput, StarRow } from "@/components/ui/Stars";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import type { Lang, PostStatus } from "@/lib/domain/types";

const TOKENS = [
  ["bg", "#0b0d0c"], ["bg-2", "#131614"], ["surface", "#171a18"], ["surface-2", "#1e2321"], ["line", "#2a2f2c"], ["line-strong", "#3a413d"],
  ["text", "#f7f7f2"], ["text-2", "#c9cfcb"], ["muted", "#7f8984"], ["mint", "#2bf2a1"], ["mint-hover", "#0fd888"], ["mint-soft", "#10261d"],
  ["deep", "#0b5e4e"], ["warning", "#f59e0b"], ["error", "#ef4444"], ["info", "#3ea6ff"],
] as const;

function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <p className="label-mono text-mint">{title}</p>
      {note && <p className="mt-1 text-[13px] text-muted">{note}</p>}
      <div className="mt-5 flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export function StyleGuide() {
  const [r1, setR1] = useState(4);
  const [r2, setR2] = useState(0);
  const [t1, setT1] = useState(true);
  const [t2, setT2] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [seg, setSeg] = useState<PostStatus>("pending");
  const [file, setFile] = useState<File | null>(null);
  const toast = useToast();
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-10">
      <header className="flex items-center gap-5">
        <Logo width={130} />
        <div>
          <h1 className="font-display text-3xl font-bold">Components &amp; variants</h1>
          <p className="text-muted">Living style guide of ARGUS Client Hub (src/components). Matches Figma pages 30–31.</p>
        </div>
      </header>

      <Block title="Color tokens" note="src/app/globals.css @theme · use bg-*, text-*, border-* classes, never hex">
        {TOKENS.map(([n, hex]) => (
          <div key={n} className="w-[128px]">
            <div className="h-14 rounded-xl border border-line" style={{ background: hex }} />
            <p className="mt-1.5 text-[13px] text-text">{n}</p>
            <p className="font-mono text-[11px] text-muted">{hex}</p>
          </div>
        ))}
      </Block>

      <Block title="Typography" note="Space Grotesk (display) · Geist (UI) · Geist Mono (labels) · Noto Sans Bengali (বাংলা)">
        <div className="flex w-full flex-col gap-3">
          <p className="font-display text-[46px] leading-none font-bold">How did we do, Rahim?</p>
          <p className="font-display text-[32px] font-bold">Page title 32</p>
          <p className="font-display text-[22px] font-medium">Section title 22</p>
          <p className="text-[15px]">Body 15 · The quick brown fox jumps over the lazy dog.</p>
          <p className="text-[13px] text-muted">Small 13 · helper text</p>
          <p className="label-mono text-muted">Label mono 11</p>
          <p className="lang-bn text-[17px]">আমাদের কাজ কেমন লাগলো? · Noto Sans Bengali</p>
        </div>
      </Block>

      <Block title="Button" note="variant: primary · secondary · outline · ghost · danger — size: sm · md · lg — states: loading, disabled">
        {(["primary", "secondary", "outline", "ghost", "danger"] as const).map((v) => (
          <div key={v} className="flex flex-col gap-2">
            <Button variant={v} size="lg" icon={<Send className="size-4" />}>{v}</Button>
            <Button variant={v} icon={<Plus className="size-4" />}>{v} md</Button>
            <Button variant={v} size="sm">{v} sm</Button>
            <Button variant={v} loading>Loading</Button>
            <Button variant={v} disabled>Disabled</Button>
          </div>
        ))}
      </Block>

      <Block title="Pill" note="tone: neutral · mint · warning · error · info, with or without dot">
        <Pill tone="info">Onboarding</Pill><Pill tone="mint">Active</Pill><Pill>Completed</Pill><Pill tone="warning">Paused</Pill>
        <Pill tone="warning">Pending</Pill><Pill tone="mint">Posted</Pill><Pill>Not for post</Pill><Pill tone="error">Follow-up open</Pill>
        <Pill tone="mint" dot={false}>Public</Pill><Pill dot={false}>Private</Pill><Pill tone="info" dot={false}>Sample data</Pill>
      </Block>

      <Block title="Rating" note="RatingInput (40 / 26 px, hover preview, arrow keys) · StarRow read-only">
        <div className="flex flex-col gap-6">
          <RatingInput name="a" ariaLabel="Rating" value={r1} onChange={setR1} labels={["", "Poor", "Fair", "Good", "Great", "Excellent"]} />
          <RatingInput name="b" ariaLabel="Rating empty" value={r2} onChange={setR2} labels={["", "Poor", "Fair", "Good", "Great", "Excellent"]} />
          <RatingInput name="c" ariaLabel="Small" value={3} onChange={() => {}} size={26} gap={5} />
        </div>
        <div className="flex flex-col gap-3">
          {[5, 4, 3, 2, 1].map((v) => <StarRow key={v} value={v} size={16} />)}
        </div>
      </Block>

      <Block title="Chip · Toggle · Segmented · Lang switch">
        <Chip selected>Website</Chip><Chip selected={false}>Ads</Chip><Chip size="sm" selected>Yes</Chip><Chip size="sm" selected={false}>Maybe</Chip>
        <Toggle label="on" checked={t1} onChange={setT1} /><Toggle label="off" checked={t2} onChange={setT2} /><Toggle label="disabled" checked disabled onChange={() => {}} />
        <div className="w-[380px]">
          <Segmented ariaLabel="Post" value={seg} onChange={setSeg} options={[{ value: "not_for_post", label: "Not for post" }, { value: "pending", label: "Pending", activeClass: "text-warning" }, { value: "posted", label: "Posted", activeClass: "text-mint" }]} />
        </div>
        <LangSwitch lang={lang} onChange={setLang} />
      </Block>

      <Block title="Fields" note="TextField · SelectField · TextArea — default, filled, error, disabled">
        <div className="grid w-full gap-4 md:grid-cols-2">
          <TextField label="Client name" name="x1" placeholder="e.g. Sabbir Ahmed" />
          <TextField label="Company" name="x2" defaultValue="Orbit Clinic" />
          <TextField label="Email" name="x3" defaultValue="wrong@" error="Enter a valid email" />
          <TextField label="Webhook" name="x4" disabled defaultValue="Set by N8N_WEBHOOK_URL" hint="from env" />
          <SelectField label="Status" name="x5" defaultValue="active"><option value="active">Active</option></SelectField>
          <TextArea label="What did we do well?" name="x6" placeholder="Type here (optional)" />
        </div>
      </Block>

      <Block title="Avatar · Founder photo · Photo picker">
        <Avatar name="Rahim Uddin" /><Avatar name="Joy Howlader" size={44} />
        <FounderAvatar src="/brand/founder-avatar.webp" size={52} />
        <div className="w-[340px]"><FounderCard src="/brand/founder-thank-you.webp" name="Joy Howlader" role="Founder, ARGUS" tag="From the founder" /></div>
        <div className="w-[340px]">
          <PhotoPicker file={file} onChange={setFile} copy={{ addPhoto: "Add photo or logo", photoHint: "Optional · PNG, JPG or WEBP · up to 5 MB", photoShown: "Shown next to your feedback", remove: "Remove", photoTooBig: "Too big", photoType: "Wrong type" }} />
        </div>
      </Block>

      <Block title="KPI · Toast">
        <div className="w-[260px]"><Kpi index={0} label="Average rating" value={4.6} decimals={1} suffix=" ★" note="From 14 replies" /></div>
        <div className="flex flex-col gap-2">
          <Button icon={<Check className="size-4" />} onClick={() => toast.success("Saved", "The Google Sheet row updates through n8n.")}>Success toast</Button>
          <Button icon={<Copy className="size-4" />} onClick={() => toast.error("Couldn't send", "Check your connection.")}>Error toast</Button>
        </div>
      </Block>
    </main>
  );
}
