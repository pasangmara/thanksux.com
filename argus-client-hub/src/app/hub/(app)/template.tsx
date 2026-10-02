"use client";

import { motion } from "motion/react";

/** Re-mounts on every dashboard navigation: a short fade-up page transition. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-5 py-7 sm:px-8 lg:px-10 lg:py-9"
    >
      {children}
    </motion.main>
  );
}
