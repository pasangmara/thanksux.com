"use client";

import { motion } from "motion/react";
import { ArrowLeft, Link2Off, Mail, MessageCircle, MessageSquareHeart } from "lucide-react";
import { useMemo } from "react";
import { FounderAvatar, FounderCard } from "@/components/brand/FounderPhoto";
import { ButtonLink } from "@/components/ui/Button";
import { StarRow } from "@/components/ui/Stars";
import { cn } from "@/components/ui/cn";
import type { Lang } from "@/lib/domain/types";
import type { FormCopy } from "@/lib/i18n/form";
import type { PublicBrand } from "@/lib/services/settings";
import { waDigits } from "@/lib/util-client";
import type { FormClient } from "./FeedbackExperience";

const ease = [0.16, 1, 0.3, 1] as const;
const item = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.12 + i * 0.08, duration: 0.6, ease } }),
};

const wa = (phone: string) => `https://wa.me/${waDigits(phone) ?? ""}`;
const SITE = "https://argusofficial.com";

/** A small, quiet burst of mint particles behind the photo. */
function Burst() {
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const r = 140 + (i % 3) * 50;
        return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.8, s: 4 + (i % 4) * 2, d: (i % 5) * 0.04 };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-0">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-mint"
          style={{ width: d.s, height: d.s }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: d.x, y: d.y, opacity: [0, 0.9, 0], scale: [0.4, 1, 0.6] }}
          transition={{ type: "tween", duration: 1.4, delay: 0.25 + d.d, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function ThankYouHigh({
  c,
  brand,
  client,
  rating,
  displayName,
  lang,
}: {
  c: FormCopy;
  brand: PublicBrand;
  client: FormClient;
  rating: number;
  displayName: string | null;
  lang: Lang;
}) {
  const fb = brand.reviewLinks.facebook;
  const google = brand.reviewLinks.google;
  return (
    <motion.div initial="hidden" animate="show" className="grid items-center gap-10 lg:grid-cols-[460px_minmax(0,520px)] lg:justify-center lg:gap-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, rotate: -1.5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.05 }}
        className="relative"
      >
        <Burst />
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ type: "tween", duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <FounderCard src={brand.photoUrl} name={brand.founderName} role={brand.founderRole} tag={c.fromFounder} />
        </motion.div>
      </motion.div>

      <div className="flex flex-col gap-6">
        <motion.div custom={0} variants={item} className="flex flex-col gap-3">
          <h1 className="font-display text-[34px] leading-[1.1] font-bold text-text lg:text-[44px]">{c.thanksTitle(client.firstName)}</h1>
          <p className="text-[15px] leading-relaxed text-text-2 lg:text-[17px]">{brand.thanks[lang]}</p>
          <p className="text-[14px] font-medium text-mint">— {lang === "bn" ? "জয় হাওলাদার, ফাউন্ডার" : `${brand.founderName}, Founder`}</p>
        </motion.div>

        <motion.div custom={1} variants={item} className="card flex flex-col gap-2.5 p-4">
          <p className={cn("text-muted", lang === "en" ? "label-mono" : "text-[12px]")}>{c.yourFeedback}</p>
          <StarRow value={rating} size={24} />
          <p className="text-[13px] text-text-2">
            {client.serviceLabel[lang]} · {client.company ?? client.name}
          </p>
          <p className={cn("text-[13px]", displayName ? "text-mint" : "text-muted")}>
            {displayName ? c.sharedAs(displayName) : c.keptPrivate}
          </p>
        </motion.div>

        {(fb || google) && (
          <motion.div custom={2} variants={item} className="flex flex-col gap-3">
            <div>
              <p className="text-[15px] font-medium text-text">{c.moreMinute}</p>
              <p className="mt-1 text-[13px] text-muted">{c.reviewWhy}</p>
            </div>
            {fb && (
              <ButtonLink href={fb} target="_blank" rel="noopener noreferrer" variant="outline" size="lg" className="w-full">
                {c.reviewFacebook}
              </ButtonLink>
            )}
            {google && (
              <ButtonLink href={google} target="_blank" rel="noopener noreferrer" variant="outline" size="lg" className="w-full">
                {c.reviewGoogle}
              </ButtonLink>
            )}
          </motion.div>
        )}

        <motion.a
          custom={3}
          variants={item}
          href={SITE}
          className="inline-flex items-center justify-center gap-1.5 self-center text-[13px] font-medium text-text-2 transition hover:text-text lg:self-start"
        >
          <ArrowLeft className="size-3.5" /> {c.backToSite}
        </motion.a>
      </div>
    </motion.div>
  );
}

function ContactCard({ c, brand, lang }: { c: FormCopy; brand: PublicBrand; lang: Lang }) {
  return (
    <div className="card flex flex-col gap-3.5 p-4">
      <div className="flex items-center gap-3">
        <FounderAvatar src={brand.avatarUrl} size={48} />
        <div>
          <p className="text-[15px] font-medium text-text">{lang === "bn" ? "জয় হাওলাদার" : brand.founderName}</p>
          <p className="text-[13px] text-muted">{brand.founderRole}</p>
        </div>
      </div>
      <p className="text-[13px] text-text-2">{c.reachJoy}</p>
      <ButtonLink href={wa(brand.contact.whatsapp)} target="_blank" rel="noopener noreferrer" variant="primary" size="lg" className="w-full" icon={<MessageCircle className="size-[18px]" />}>
        {c.whatsapp} {brand.contact.whatsapp}
      </ButtonLink>
      <ButtonLink href={`mailto:${brand.contact.email}`} variant="ghost" size="lg" className="w-full text-mint hover:text-mint" icon={<Mail className="size-[18px]" />}>
        {c.email} {brand.contact.email}
      </ButtonLink>
    </div>
  );
}

export function ThankYouLow({ c, brand, lang }: { c: FormCopy; brand: PublicBrand; lang: Lang }) {
  return (
    <motion.div initial="hidden" animate="show" className="mx-auto flex max-w-[520px] flex-col gap-6">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="grid size-[72px] place-items-center rounded-full border-[1.5px] border-warning bg-warning-soft text-warning"
      >
        <MessageSquareHeart className="size-8" />
      </motion.span>
      <motion.div custom={0} variants={item} className="flex flex-col gap-3">
        <h1 className="font-display text-[32px] leading-[1.12] font-bold text-text">{c.lowTitle}</h1>
        <p className="text-[15px] leading-relaxed text-text-2">{c.lowBody}</p>
      </motion.div>
      <motion.div custom={1} variants={item}>
        <ContactCard c={c} brand={brand} lang={lang} />
      </motion.div>
      <motion.p custom={2} variants={item} className="text-[13px] text-muted">
        {c.privateNote}
      </motion.p>
    </motion.div>
  );
}

export function StatusView({
  c,
  brand,
  kind,
  firstName,
}: {
  c: FormCopy;
  brand: PublicBrand;
  kind: "used" | "invalid";
  firstName?: string;
}) {
  const used = kind === "used";
  return (
    <motion.div initial="hidden" animate="show" className="mx-auto flex max-w-[520px] flex-col gap-6">
      {used ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }}>
          <FounderCard src={brand.photoUrl} name={brand.founderName} role={brand.founderRole} tag={c.fromFounder} />
        </motion.div>
      ) : (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="grid size-[72px] place-items-center rounded-full border-[1.5px] border-error bg-error-soft text-error"
        >
          <Link2Off className="size-8" />
        </motion.span>
      )}
      <motion.div custom={0} variants={item} className="flex flex-col gap-3">
        <h1 className="font-display text-[32px] leading-[1.12] font-bold text-text">
          {used && firstName ? `${c.usedTitle}, ${firstName}` : used ? c.usedTitle : c.invalidTitle}
        </h1>
        <p className="text-[15px] leading-relaxed text-text-2">{used ? c.usedBody : c.invalidBody}</p>
      </motion.div>
      <motion.div custom={1} variants={item} className="flex flex-col gap-2.5">
        <ButtonLink href={wa(brand.contact.whatsapp)} target="_blank" rel="noopener noreferrer" variant="primary" size="lg" className="w-full" icon={<MessageCircle className="size-[18px]" />}>
          {c.whatsapp} {brand.contact.whatsapp}
        </ButtonLink>
        <ButtonLink href={`mailto:${brand.contact.email}`} variant="outline" size="lg" className="w-full" icon={<Mail className="size-[18px]" />}>
          {c.email} {brand.contact.email}
        </ButtonLink>
      </motion.div>
      <motion.a custom={2} variants={item} href={SITE} className="inline-flex items-center gap-1.5 self-center text-[13px] font-medium text-text-2 hover:text-text">
        <ArrowLeft className="size-3.5" /> {c.backToSite}
      </motion.a>
    </motion.div>
  );
}
