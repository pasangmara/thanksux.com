/**
 * [UX Audit Engine — screenshot path] Deliberately small. This project has
 * no computer-vision/OCR pipeline and adds none here (no new dependency,
 * no external AI vision API) — per this phase's explicit "do not build a
 * fake AI score generator" / "never claim something cannot be observed"
 * requirement, that means the only things this module claims to observe
 * are things a dimension/byte-level read of the image file can actually
 * prove: pixel dimensions, aspect ratio, format, file weight. Everything a
 * real screenshot audit tool would need pixel access for — color contrast,
 * typography, spacing, visual hierarchy, CTA prominence — is NOT computed
 * here; rules.ts turns that gap into explicit "Needs manual verification"
 * findings instead of a fabricated one.
 *
 * Dimension reading is a minimal, dependency-free parser for the three
 * accepted formats' headers — no new package (this project has a
 * zero-runtime-dependency policy) and no full image decode, just enough of
 * each container format's header to read width/height.
 */

export interface ScreenshotEvidence {
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  /** Best-effort guess at the capture's likely target device, purely from pixel width — never presented as certain. */
  likelyDevice: "mobile" | "tablet" | "desktop" | "unknown";
}

function readPngDimensions(buf: Buffer): { width: number; height: number } | null {
  // PNG signature (8 bytes) + IHDR chunk: length(4) type(4) width(4) height(4)
  if (buf.length < 24) return null;
  const isPng = buf.readUInt32BE(0) === 0x89504e47 && buf.readUInt32BE(4) === 0x0d0a1a0a;
  if (!isPng) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

function readJpegDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    // SOF0-SOF3, SOF5-SOF7, SOF9-SOF11, SOF13-SOF15 carry dimensions; skip restart/standalone markers.
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    const segmentLength = buf.readUInt16BE(offset + 2);
    if (isSof) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + segmentLength;
  }
  return null;
}

function readWebpDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30) return null;
  const isRiff = buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
  if (!isRiff) return null;
  const chunkFourCC = buf.toString("ascii", 12, 16);
  if (chunkFourCC === "VP8 ") {
    // Lossy: dimensions are 14-bit values at bytes 26-29 (little-endian), masked.
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }
  if (chunkFourCC === "VP8L") {
    const bits = buf.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }
  if (chunkFourCC === "VP8X") {
    const width = (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1;
    const height = (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1;
    return { width, height };
  }
  return null;
}

function readDimensions(buf: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === "image/png") return readPngDimensions(buf);
    if (mimeType === "image/jpeg") return readJpegDimensions(buf);
    if (mimeType === "image/webp") return readWebpDimensions(buf);
  } catch {
    return null;
  }
  return null;
}

function guessDevice(width: number | null): ScreenshotEvidence["likelyDevice"] {
  if (!width) return "unknown";
  if (width <= 480) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

export function extractScreenshotSignals(buf: Buffer, mimeType: string): ScreenshotEvidence {
  const dims = readDimensions(buf, mimeType);
  const width = dims?.width ?? null;
  const height = dims?.height ?? null;
  return {
    mimeType,
    fileSizeBytes: buf.byteLength,
    width,
    height,
    aspectRatio: width && height ? Number((width / height).toFixed(3)) : null,
    likelyDevice: guessDevice(width),
  };
}
