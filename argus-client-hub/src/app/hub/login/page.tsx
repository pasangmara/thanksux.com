import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Backdrop } from "@/components/brand/Backdrop";
import { Logo } from "@/components/brand/Logo";
import { getCurrentMember } from "@/lib/auth/session";
import { DEMO_LOGIN } from "@/lib/data/seed";
import { env, isDemoMode } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentMember()) redirect("/hub");
  const { next } = await searchParams;
  const demo = isDemoMode();
  return (
    <main className="relative grid min-h-dvh place-items-center px-5 py-10">
      <Backdrop />
      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center gap-7">
        <Logo width={150} priority />
        <div className="card w-full p-7 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
          <p className="label-mono text-mint">Client hub</p>
          <h1 className="mt-2 font-display text-[32px] font-bold">Sign in</h1>
          <p className="mt-1 mb-6 text-[15px] text-muted">For the ARGUS team only.</p>
          <LoginForm
            next={next}
            // Pre-fill only the public demo login, never a real ADMIN_PASSWORD.
            demo={demo ? (env.adminPassword ? { email: env.adminEmail, password: "" } : DEMO_LOGIN) : null}
          />
          {demo ? (
            <p className="mt-5 rounded-lg border border-info/30 bg-info-soft px-3 py-2 text-[12.5px] text-info">
              Demo mode (no DATABASE_URL). Sample data only. Login is pre-filled.
            </p>
          ) : (
            <p className="mt-5 text-[13px] text-muted">Forgot your password? Ask an admin to reset it in Settings → Team.</p>
          )}
        </div>
        <p className="font-mono text-[12px] text-muted">app.argusofficial.com</p>
      </div>
    </main>
  );
}
