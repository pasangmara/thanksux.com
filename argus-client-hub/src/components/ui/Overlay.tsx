"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

function useDialogBehaviour(open: boolean, onClose: () => void, panel: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus], input, select, textarea, button:not([data-close])");
      (first ?? panel.current)?.focus();
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        // Keep keyboard focus inside the dialog.
        const items = panel.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, onClose, panel]);
}

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = 600,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: number;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useDialogBehaviour(open, onClose, panel);
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              tabIndex={-1}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.16 } }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              style={{ maxWidth: width }}
              className="scrollbar-thin relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line-strong bg-surface p-6 shadow-2xl shadow-black/60 outline-none sm:rounded-3xl sm:p-7"
            >
              <div className="mb-5 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <h2 id="modal-title" className="font-display text-[22px] font-medium text-text">
                    {title}
                  </h2>
                  {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
                </div>
                <button
                  data-close
                  onClick={onClose}
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-lg border border-line bg-surface-2 text-text-2 transition hover:text-text"
                >
                  <X className="size-4" />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

export function Drawer({
  open,
  onClose,
  children,
  label,
  width = 480,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label: string;
  width?: number;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useDialogBehaviour(open, onClose, panel);
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              tabIndex={-1}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%", transition: { duration: 0.2, ease: "easeIn" } }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              style={{ maxWidth: width }}
              className={cn(
                "absolute inset-y-0 right-0 flex w-full flex-col border-l border-line-strong bg-surface shadow-[-30px_0_80px_rgba(0,0,0,0.55)] outline-none",
                className,
              )}
            >
              {children}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
