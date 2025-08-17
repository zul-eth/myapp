import { getApplicationManager } from "@/core";
import { CoinNetworkUpdateSchema } from "@/lib/validation/coin-network";
import { badRequest, json, notFound } from "@/lib/http/responses";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = CoinNetworkUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");

  try {
    const updated = await app.coinNetwork.service.update(id, parsed.data);
    return json(updated, 200);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal mengubah relasi";
    if (e.code === "P2025" || /tidak ditemukan/i.test(msg)) return notFound("Relasi tidak ditemukan");
    return badRequest(msg);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  try {
    const res = await app.coinNetwork.service.delete(id);
    return json(res, 200);
  } catch (e: any) {
    if (e.code === "P2025") return notFound("Relasi tidak ditemukan");
    return badRequest(e?.message ?? "Gagal menghapus relasi");
  }
}
