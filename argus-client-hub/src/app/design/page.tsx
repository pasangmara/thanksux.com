import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StyleGuide } from "@/components/StyleGuide";
import { env, isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Components" };
// Decide at request time (DATABASE_URL may only exist at runtime).
export const dynamic = "force-dynamic";

/** Living style guide. Available in development and demo mode only. */
export default function DesignPage() {
  if (env.isProd && !isDemoMode()) notFound();
  return <StyleGuide />;
}
