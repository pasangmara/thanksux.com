import "server-only";
import { getStore } from "@/lib/data/store";
import { nowIso, uid } from "@/lib/util";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const SIGNATURES: { mime: string; test: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/webp", test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
];

export class UploadError extends Error {}

/**
 * Stores an uploaded image after checking size and the real file signature
 * (the browser-supplied type is not trusted). SVG is rejected on purpose:
 * it can carry scripts.
 */
export async function saveImage(file: File): Promise<string> {
  if (!file || file.size === 0) throw new UploadError("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Image must be 5 MB or smaller.");
  const data = Buffer.from(await file.arrayBuffer());
  const sig = SIGNATURES.find((s) => s.test(data));
  if (!sig) throw new UploadError("Please upload a JPG, PNG or WEBP image.");
  const id = uid();
  const store = await getStore();
  await store.putFile({
    id,
    name: file.name.replace(/[^\w.\- ]+/g, "").slice(0, 120) || "image",
    mime: sig.mime,
    size: data.length,
    created_at: nowIso(),
    data,
  });
  return id;
}

export const isFile = (v: FormDataEntryValue | null): v is File =>
  typeof v === "object" && v !== null && "arrayBuffer" in v && (v as File).size > 0;
