import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

/**
 * Upload a prospect photo to object storage and return its public URL, which is
 * then stored as the value of an IMAGE custom field. Requires BLOB_READ_WRITE_TOKEN.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Image upload isn't configured yet (missing storage token)" },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 6 MB" }, { status: 400 });
  }

  // Tenant-prefixed path keeps each org's uploads namespaced.
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-60);
  const blob = await put(`prospects/${session.orgId}/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
    token,
  });

  return NextResponse.json({ url: blob.url });
}
