"use client";

import { AnimatePresence, motion } from "motion/react";
import { ImagePlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoPicker({
  file,
  onChange,
  copy,
  label,
  hint,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  copy: Record<"addPhoto" | "photoHint" | "photoShown" | "remove" | "photoTooBig" | "photoType", string>;
  label?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  const accept = (f: File | undefined | null) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return setError(copy.photoType);
    if (f.size > MAX) return setError(copy.photoTooBig);
    setError(null);
    onChange(f);
  };

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {file && preview ? (
          <motion.div
            key="added"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex items-center gap-3.5 rounded-xl border border-line bg-bg-2 px-4 py-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={preview} alt="" className="size-11 rounded-full object-cover ring-1 ring-mint/30" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-text">{file.name}</p>
              <p className="text-[13px] text-muted">{hint ?? copy.photoShown}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                if (input.current) input.current.value = "";
              }}
              className="rounded-md px-2 py-1 text-[13px] font-medium text-text-2 transition hover:text-text"
            >
              {copy.remove}
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              accept(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex w-full items-center gap-3.5 rounded-xl border border-dashed bg-bg-2 px-4 py-3 text-left transition-colors",
              drag ? "border-mint bg-mint-soft/40" : "border-line-strong hover:border-muted",
            )}
          >
            <span className="grid size-11 place-items-center rounded-[10px] bg-surface-2 text-mint">
              <ImagePlus className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium text-text">{label ?? copy.addPhoto}</span>
              <span className="block text-[13px] text-muted">{copy.photoHint}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      <input
        ref={input}
        type="file"
        accept={TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {error && (
        <p className="mt-1.5 text-[13px] text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
