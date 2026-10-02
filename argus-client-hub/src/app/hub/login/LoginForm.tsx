"use client";

import { motion } from "motion/react";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/app/hub/actions/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

export function LoginForm({ next, demo }: { next?: string; demo: { email: string; password: string } | null }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField label="Email" name="email" type="email" autoComplete="username" required defaultValue={demo?.email} />
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label htmlFor="password" className="text-[14px] font-medium text-text">
            Password
          </label>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            defaultValue={demo?.password}
            className="field h-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-text"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      {state && !state.ok && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0, x: [0, -6, 6, -3, 3, 0] }}
          transition={{ type: "tween", duration: 0.4 }}
          className="rounded-lg bg-error-soft px-3 py-2 text-[13px] text-error"
          role="alert"
        >
          {state.error}
        </motion.p>
      )}
      <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
