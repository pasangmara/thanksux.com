"use client";

import { motion } from "motion/react";
import { CountUp } from "@/components/ui/CountUp";

export function Kpi({ label, value, decimals = 0, suffix, note, index }: { label: string; value: number | null; decimals?: number; suffix?: string; note: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="card flex flex-col gap-2 p-5"
    >
      <p className="label-mono text-muted">{label}</p>
      <p className="font-display text-[30px] leading-none font-bold text-text">
        {value === null ? "—" : <CountUp value={value} decimals={decimals} suffix={suffix} />}
      </p>
      <p className="text-[13px] text-text-2">{note}</p>
    </motion.div>
  );
}

export function RatingBars({ distribution, total }: { distribution: number[]; total: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {[5, 4, 3, 2, 1].map((r, i) => {
        const n = distribution[r] ?? 0;
        const pct = total ? (n / total) * 100 : 0;
        return (
          <div key={r} className="flex items-center gap-3 text-[13px]">
            <span className="w-7 text-text-2 tabular-nums">{r}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className={r >= 4 ? "h-full rounded-full bg-mint" : r === 3 ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-error"}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="w-5 text-right text-muted tabular-nums">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Staggered list wrapper for rows. */
export function StaggerList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.045 } } }} className={className}>
      {children}
    </motion.ul>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.li
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
      className={className}
    >
      {children}
    </motion.li>
  );
}
