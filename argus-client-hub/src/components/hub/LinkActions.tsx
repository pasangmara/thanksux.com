"use client";

import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { markLinkSentAction } from "@/app/hub/actions/clients";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/Toast";
import type { Client } from "@/lib/domain/types";
import { feedbackUrl, inviteMessage, mailtoLink, whatsappLink } from "@/lib/services/links";

type LinkClient = Pick<Client, "id" | "name" | "services" | "preferred_language" | "whatsapp" | "email" | "feedback_code">;

export function useLinkActions(client: LinkClient, baseUrl: string, founder = "Joy") {
  const toast = useToast();
  const [, start] = useTransition();
  const url = feedbackUrl(baseUrl, client.feedback_code);
  const message = inviteMessage(client, url, founder);
  const wa = whatsappLink(client.whatsapp, message);
  const mail = mailtoLink(client.email, message, client.preferred_language);
  const record = (channel: "whatsapp" | "email" | "copy") =>
    start(async () => {
      const res = await markLinkSentAction(client.id, channel);
      if (!res.ok) toast.error(res.error);
    });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", url.replace(/^https?:\/\//, ""));
      record("copy");
      return true;
    } catch {
      toast.error("Couldn't copy", "Select the link and copy it by hand.");
      return false;
    }
  };
  return { url, message, wa, mail, record, copy };
}

/** Three compact icon buttons used in table rows. */
export function LinkIconButtons({ client, baseUrl }: { client: LinkClient; baseUrl: string }) {
  const { wa, mail, record, copy } = useLinkActions(client, baseUrl);
  const [copied, setCopied] = useState(false);
  const base = "grid size-8 place-items-center rounded-lg border border-line transition-colors";
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={async () => {
          if (await copy()) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }
        }}
        title="Copy feedback link"
        aria-label={`Copy feedback link for ${client.name}`}
        className={cn(base, "bg-surface-2 text-text-2 hover:text-text")}
      >
        {copied ? <Check className="size-4 text-mint" /> : <Copy className="size-4" />}
      </button>
      <a
        href={wa ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => (wa ? record("whatsapp") : e.preventDefault())}
        aria-disabled={!wa}
        title={wa ? "Send on WhatsApp" : "No WhatsApp number"}
        aria-label={`Send feedback link to ${client.name} on WhatsApp`}
        className={cn(base, wa ? "bg-mint-soft text-mint hover:border-mint/50" : "cursor-not-allowed bg-surface-2 text-muted/40")}
      >
        <MessageCircle className="size-4" />
      </a>
      <a
        href={mail ?? undefined}
        onClick={(e) => (mail ? record("email") : e.preventDefault())}
        aria-disabled={!mail}
        title={mail ? "Send by email" : "No email address"}
        aria-label={`Email feedback link to ${client.name}`}
        className={cn(base, mail ? "bg-surface-2 text-text-2 hover:text-text" : "cursor-not-allowed bg-surface-2 text-muted/40")}
      >
        <Mail className="size-4" />
      </a>
    </div>
  );
}

/** Full-size buttons (client detail, add-client success). */
export function LinkButtons({ client, baseUrl, compact }: { client: LinkClient; baseUrl: string; compact?: boolean }) {
  const { wa, mail, record, copy } = useLinkActions(client, baseUrl);
  return (
    <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
      <Button variant="secondary" icon={<Copy className="size-4" />} onClick={copy}>
        Copy link
      </Button>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => record("whatsapp")}
          className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-mint px-3.5 text-sm font-semibold text-on-mint transition hover:bg-mint-hover active:scale-[0.97]"
        >
          <MessageCircle className="size-4" /> Send on WhatsApp
        </a>
      )}
      {mail && (
        <a
          href={mail}
          onClick={() => record("email")}
          className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line-strong bg-surface-2 px-3.5 text-sm font-semibold text-text transition hover:border-muted/60 active:scale-[0.97]"
        >
          <Mail className="size-4" /> Email
        </a>
      )}
    </div>
  );
}
