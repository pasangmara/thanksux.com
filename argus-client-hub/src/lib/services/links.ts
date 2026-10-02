import type { Client } from "@/lib/domain/types";
import { servicesLabel } from "@/lib/domain/labels";
import { firstName, waDigits } from "@/lib/util-client";

/** Pure helpers (safe for client components): links and ready-to-send messages. */

export const feedbackUrl = (base: string, code: string) => `${base}/feedback/${code}`;

export function inviteMessage(client: Pick<Client, "name" | "services" | "preferred_language">, url: string, founder = "Joy") {
  const name = firstName(client.name);
  if (client.preferred_language === "bn") {
    return `হাই ${name}, ARGUS-এর সাথে কাজ করার জন্য ধন্যবাদ! ${servicesLabel(client.services, "bn")} নিয়ে ১ মিনিটের একটা মতামত দেবেন? ${url}\n— ${founder}, ARGUS`;
  }
  return `Hi ${name}, thank you for working with ARGUS! Could you share 1 minute of feedback on your ${servicesLabel(client.services)} project? ${url}\n— ${founder}, ARGUS`;
}

export function whatsappLink(phone: string | null, message: string): string | null {
  const d = waDigits(phone);
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(message)}` : null;
}

export function mailtoLink(email: string | null, message: string, lang: "en" | "bn" = "en"): string | null {
  if (!email) return null;
  const subject = lang === "bn" ? "ARGUS: আপনার ১ মিনিটের মতামত" : "ARGUS: 1 minute of feedback?";
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
