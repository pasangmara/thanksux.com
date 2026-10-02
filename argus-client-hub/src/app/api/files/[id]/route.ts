import { getStore } from "@/lib/data/store";

/**
 * Serves uploaded images by their random id. Founder photos are public by
 * design. Client photos/logos are only uploaded when the client agreed to
 * public sharing, and their ids are unguessable UUIDs.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const store = await getStore();
  const file = await store.getFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "content-type": file.mime,
      "content-length": String(file.size),
      // A file id never changes content, so browsers and CDNs may cache it forever.
      "cache-control": "public, max-age=31536000, immutable",
      "content-security-policy": "default-src 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}
