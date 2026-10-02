import type { ClientStatus, LinkStatus, PostStatus, Recommend, Service } from "./types";

export const SERVICE_LABEL: Record<Service, { en: string; bn: string }> = {
  brand: { en: "Brand identity", bn: "ব্র্যান্ড আইডেন্টিটি" },
  website: { en: "Website", bn: "ওয়েবসাইট" },
  ai_automation: { en: "AI Automation", bn: "এআই অটোমেশন" },
  ads: { en: "Ads", bn: "বিজ্ঞাপন" },
  content: { en: "Content", bn: "কনটেন্ট" },
};

export function servicesLabel(services: Service[], lang: "en" | "bn" = "en"): string {
  if (!services.length) return lang === "bn" ? "সার্ভিস" : "Service";
  return services.map((s) => SERVICE_LABEL[s][lang]).join(" + ");
}

export type Tone = "neutral" | "mint" | "warning" | "error" | "info";

export const CLIENT_STATUS_META: Record<ClientStatus, { label: string; tone: Tone }> = {
  onboarding: { label: "Onboarding", tone: "info" },
  active: { label: "Active", tone: "mint" },
  completed: { label: "Completed", tone: "neutral" },
  paused: { label: "Paused", tone: "warning" },
};

export const POST_STATUS_META: Record<PostStatus, { label: string; tone: Tone }> = {
  not_for_post: { label: "Not for post", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  posted: { label: "Posted", tone: "mint" },
};

export const LINK_STATUS_META: Record<LinkStatus, { label: string; tone: Tone }> = {
  not_sent: { label: "Link not sent", tone: "info" },
  sent: { label: "Link sent", tone: "neutral" },
  opened: { label: "Opened", tone: "warning" },
  submitted: { label: "Answered", tone: "mint" },
};

export const RECOMMEND_LABEL: Record<Recommend, string> = { yes: "Yes", maybe: "Maybe", no: "No" };

export const RATING_WORDS = {
  en: ["", "Poor", "Fair", "Good", "Great", "Excellent"],
  bn: ["", "খারাপ", "মোটামুটি", "ভালো", "খুব ভালো", "অসাধারণ"],
} as const;
