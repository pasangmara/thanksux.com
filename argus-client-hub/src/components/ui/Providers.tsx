"use client";

import { MotionConfig } from "motion/react";
import { ToastProvider } from "./Toast";

/** reducedMotion="user": every animation respects the OS "reduce motion" setting. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
