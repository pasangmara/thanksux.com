"use client";

import { type FormEvent, useState } from "react";
import { Button, Container } from "@/components/ui";
import { FloatingLabelInput } from "@/components/experimental/FloatingLabelInput";
import { contactIcons } from "@/components/icons";
import { projectTypes, responseTimeLine } from "@/content/site";
import { socialLinks, type SocialLink } from "@/content/personal";
import { trackEvent } from "@/lib/analytics/track";
import type { AnalyticsEventName } from "@/lib/analytics/events";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

/** [Phase L] Which named click event a contact-method glyph maps to — email/whatsapp/phone get their own dedicated event, everything else is a generic `click_social` with the platform recorded as a param. */
function contactClickEvent(icon: SocialLink["icon"]): AnalyticsEventName {
  if (icon === "email") return "click_email";
  if (icon === "whatsapp") return "click_whatsapp";
  return "click_social";
}

type Errors = Partial<Record<"name" | "email" | "message", string>>;

// Bordered, rounded fields — revised from the original underline-only
// style specifically so "Inputs: medium radius" (visual-refinement brief
// §01) has something to actually round; an underline alone has no visible
// corners. See docs/DESIGN_SYSTEM.md §9 changelog note.
const fieldBase =
  "w-full rounded-md border border-border bg-surface px-3 text-body transition-colors duration-150 ease-out focus:border-accent focus:shadow-focus focus:outline-none";
const textareaClass = `${fieldBase} min-h-[120px] py-2 resize-y`;
// Native <select> keeps every native behavior (click-anywhere, keyboard nav,
// value display) — only its browser-drawn arrow is replaced, since that arrow
// renders inconsistently across browsers once a select has custom border/
// radius/height, and was clipping/overlapping this field's border. appearance-
// none removes it; pr-6 (48px, on the 8px spacing scale) reserves clearance
// for the custom chevron below so text never runs under it.
const selectFieldClass =
  "h-6 w-full appearance-none rounded-md border border-border bg-surface py-0 pl-3 pr-6 text-body transition-colors duration-150 ease-out focus:border-accent focus:shadow-focus focus:outline-none";

function ContactForm({ contactProjectTypes, emailHref }: { contactProjectTypes: readonly string[]; emailHref: string }) {
  const [values, setValues] = useState({ name: "", email: "", projectType: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors: Errors = {};
    if (!values.name.trim()) nextErrors.name = "Enter your name.";
    if (!values.email.trim()) nextErrors.email = "Enter your email.";
    else if (!/^\S+@\S+\.\S+$/.test(values.email)) nextErrors.email = "Enter a valid email address.";
    if (!values.message.trim()) nextErrors.message = "Enter a short message.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const subject = encodeURIComponent(
      `Project inquiry${values.projectType ? ` — ${values.projectType}` : ""}`,
    );
    const body = encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`);
    // mailto: link, not an internal Next.js route — no backend exists yet (out of scope for this pass).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${emailHref}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <FloatingLabelInput
        id="name"
        label="Name"
        type="text"
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        error={errors.name}
      />

      <FloatingLabelInput
        id="email"
        label="Email"
        type="email"
        value={values.email}
        onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        error={errors.email}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="projectType" className="text-caption">
          Project type
        </label>
        <div className="relative">
          <select
            id="projectType"
            value={values.projectType}
            onChange={(e) => setValues((v) => ({ ...v, projectType: e.target.value }))}
            className={selectFieldClass}
          >
            <option value="">Select one</option>
            {contactProjectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute right-3 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-text-secondary"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-caption">
          Message
        </label>
        <textarea
          id="message"
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          className={textareaClass}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message ? (
          <p id="message-error" className="text-caption text-error">
            {errors.message}
          </p>
        ) : null}
      </div>

      <div>
        <Button type="submit" variant="primary" className="w-full tablet:w-auto">
          Send message
        </Button>
        <p className="text-caption mt-2">Opens your email client with this pre-filled.</p>
      </div>
    </form>
  );
}

/**
 * [CMS Phase D2] All props optional, defaulting to the static imports —
 * see SiteNav.tsx's identical pattern/rationale. The homepage passes the
 * persisted, admin-editable values instead.
 *
 * [CMS Phase D3] `directDetails` (email/phone/location) is new and
 * optional, defaulting to unset — the homepage doesn't pass it, so its
 * rendering is unchanged. These three fields were already editable in
 * /admin/contact but explicitly documented there as "not yet read by
 * ContactSection.tsx" (the form's mailto: recipient came from
 * `contactSocialLinks`' Email entry instead). The real /contact route
 * passes them so they finally have a public destination, distinct from
 * the social/contact-method list below.
 */
export function ContactSection({
  heading = "Contact",
  description = "Direct channels first — the form is here too, but it's not the fastest way to reach me.",
  contactSocialLinks = socialLinks,
  contactProjectTypes = projectTypes,
  contactResponseTimeLine = responseTimeLine,
  directDetails,
}: {
  heading?: string;
  description?: string;
  contactSocialLinks?: SocialLink[];
  contactProjectTypes?: readonly string[];
  contactResponseTimeLine?: string;
  directDetails?: { email?: string; phone?: string; location?: string };
} = {}) {
  const emailMethod = contactSocialLinks.find((m) => m.icon === "email") ?? contactSocialLinks[0];
  // [Real owner profile sync] Phone and Location previously rendered as
  // inert text here — neither had a clickable destination anywhere on the
  // site (Phone has no icon-list entry at all; Location never did either).
  // `href` is optional per item so Email (already a real link in the
  // contactSocialLinks list below) doesn't need a second, redundant one here.
  const directDetailItems = [
    directDetails?.email ? { label: "Email", value: directDetails.email, href: `mailto:${directDetails.email}` } : null,
    directDetails?.phone ? { label: "Phone", value: directDetails.phone, href: `tel:${directDetails.phone.replace(/\s+/g, "")}` } : null,
    directDetails?.location
      ? {
          label: "Location",
          value: directDetails.location,
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directDetails.location)}`,
        }
      : null,
  ].filter((item): item is { label: string; value: string; href: string } => item !== null);

  return (
    <section id="contact" className="py-12 tablet:py-16">
      <Container variant="wide">
        <ScrollReveal>
          <SectionHeader title={heading} description={description} />
        </ScrollReveal>

        <div className="mt-8 grid grid-cols-1 gap-12 desktop:grid-cols-12">
          <ScrollReveal className="desktop:col-span-5">
            {directDetailItems.length > 0 ? (
              <div className="mb-6 grid grid-cols-2 gap-4">
                {directDetailItems.map((item) => {
                  const external = item.href.startsWith("http");
                  return (
                    <div key={item.label} className="min-w-0">
                      <p className="text-caption">{item.label}</p>
                      <a
                        href={item.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noreferrer" : undefined}
                        onClick={() => trackEvent("click_contact", { platform: item.label.toLowerCase() })}
                        className="text-body mt-1 block break-words text-ink underline-offset-2 hover:text-accent hover:underline"
                      >
                        {item.value}
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <ul className="flex flex-col gap-4">
              {contactSocialLinks.filter((m) => m.visible !== false).map((method) => {
                const Icon = contactIcons[method.icon];
                const external = method.href.startsWith("http");
                return (
                  <li key={method.label}>
                    <a
                      href={method.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      onClick={() => {
                        trackEvent("click_contact", { platform: method.icon });
                        trackEvent(contactClickEvent(method.icon), { platform: method.icon });
                      }}
                      className="group flex items-center gap-3"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-border text-ink transition-colors duration-150 ease-out group-hover:border-accent group-hover:text-accent">
                        {method.customIcon?.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={method.customIcon.src} alt="" className="h-3 w-3 object-contain" />
                        ) : (
                          <Icon className="h-3 w-3" />
                        )}
                      </span>
                      <span>
                        <span className="text-body block">{method.label}</span>
                        <span className="text-caption block">{method.value}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="text-caption mt-6">{contactResponseTimeLine}</p>
          </ScrollReveal>

          <ScrollReveal className="desktop:col-span-6 desktop:col-start-7">
            {emailMethod ? (
              <ContactForm contactProjectTypes={contactProjectTypes} emailHref={emailMethod.href} />
            ) : null}
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
