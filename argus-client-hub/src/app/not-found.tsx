import Link from "next/link";
import { Backdrop } from "@/components/brand/Backdrop";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <Backdrop />
      <div className="relative z-10 flex max-w-sm flex-col items-center gap-5 text-center">
        <Logo width={130} />
        <h1 className="font-display text-3xl font-bold">Page not found</h1>
        <p className="text-text-2">This page doesn’t exist. If you got a feedback link from ARGUS, please check it was copied fully.</p>
        <Link href="https://argusofficial.com" className="text-sm font-medium text-mint hover:underline">
          Go to argusofficial.com
        </Link>
      </div>
    </main>
  );
}
