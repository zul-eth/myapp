import { getApplicationManager } from "@/core";
import { NetworkUpdateSchema } from "@/lib/validation/network";
import { badRequest, conflict, json, notFound } from "@/lib/http/responses";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = NetworkUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");

  try {
    const updated = await app.network.service.update(id, parsed.data);
    return json(updated, 200);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal mengubah network";
    if (/tidak ditemukan/i.test(msg)) return notFound(msg);
    if (/sudah ada/i.test(msg)) return conflict(msg);
    return badRequest(msg);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  try {
    const res = await app.network.service.deleteHard(id);
    return json(res, 200);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal menghapus network";
    if (/tidak ditemukan/i.test(msg)) return notFound(msg);
    return badRequest(msg);
  }
}
