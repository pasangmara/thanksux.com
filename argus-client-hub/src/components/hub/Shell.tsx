"use client";

import { AnimatePresence, motion } from "motion/react";
import { BarChart3, LogOut, Menu, MessageSquareText, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/hub/actions/auth";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/components/ui/cn";
import type { PublicMember } from "@/lib/domain/types";

export interface ShellInfo {
  member: PublicMember;
  feedbackBadge: number;
  n8n: { connected: boolean; waiting: number; failed: number };
  demo: boolean;
}

const NAV = [
  { href: "/hub", label: "Overview", icon: BarChart3 },
  { href: "/hub/clients", label: "Clients", icon: Users },
  { href: "/hub/feedback", label: "Feedback", icon: MessageSquareText },
  { href: "/hub/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/hub" ? pathname === "/hub" : pathname.startsWith(href);
}

function SidebarBody({ info, onNavigate }: { info: ShellInfo; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { n8n } = info;
  return (
    <div className="flex h-full flex-col px-5 pt-7 pb-5">
      <Link href="/hub" onClick={onNavigate} className="self-start rounded-md">
        <Logo width={114} />
      </Link>
      <p className="label-mono mt-7 mb-2.5 text-muted">Client hub</p>
      <nav className="flex flex-col gap-1" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          const badge = href === "/hub/feedback" ? info.feedbackBadge : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors",
                active ? "font-medium text-text" : "text-text-2 hover:bg-surface-2/60 hover:text-text",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-[10px] bg-mint-soft"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <Icon className={cn("relative size-[18px]", active ? "text-mint" : "text-muted group-hover:text-text-2")} />
              <span className="relative flex-1">{label}</span>
              {badge > 0 && (
                <span
                  className={cn(
                    "relative min-w-5 rounded-full px-1.5 text-center text-[12px] leading-5 font-semibold",
                    active ? "bg-mint text-on-mint" : "bg-surface-2 text-text-2",
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <Link
        href="/hub/settings#integrations"
        onClick={onNavigate}
        className="mb-4 flex flex-col gap-1 rounded-xl border border-line bg-surface px-3.5 py-3 transition hover:border-line-strong"
      >
        <span className="flex items-center gap-2 text-[13px] font-medium text-text">
          <span className="relative flex size-2">
            {n8n.connected && n8n.failed === 0 && <span className="absolute inset-0 animate-ping rounded-full bg-mint/60" />}
            <span className={cn("relative size-2 rounded-full", !n8n.connected ? "bg-muted" : n8n.failed ? "bg-error" : "bg-mint")} />
          </span>
          {!n8n.connected ? "n8n not connected" : n8n.failed ? "n8n sync error" : "n8n connected"}
        </span>
        <span className="text-[12px] text-muted">
          {n8n.waiting ? `${n8n.waiting} event${n8n.waiting > 1 ? "s" : ""} waiting` : "All events sent"}
        </span>
      </Link>

      <div className="flex items-center gap-2.5 border-t border-line pt-4">
        <Avatar name={info.member.name} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-text">{info.member.name}</p>
          <p className="text-[12px] text-muted capitalize">{info.member.role}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function Shell({ info, children }: { info: ShellInfo; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <div className="hidden border-r border-line bg-bg-2 lg:block">
        <aside className="sticky top-0 h-dvh">
          <SidebarBody info={info} />
        </aside>
      </div>

      {/* Mobile / tablet top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-bg-2/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo width={96} />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-text"
        >
          <Menu className="size-5" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 w-[272px] border-r border-line bg-bg-2"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute top-6 right-4 grid size-8 place-items-center rounded-lg text-muted hover:text-text"
              >
                <X className="size-4" />
              </button>
              <SidebarBody info={info} onNavigate={() => setOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
