import { getApplicationManager } from "@/core";
import { CoinUpdateSchema } from "@/lib/validation/coin";
import { badRequest, conflict, json, notFound } from "@/lib/http/responses";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = CoinUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Input tidak valid";
    return badRequest(msg);
  }

  try {
    const updated = await app.coin.service.update(id, parsed.data);
    return json(updated, 200);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal mengubah coin";

    // ✅ Map 'not found' dengan andal (pesan & code Prisma)
    if (e?.code === "P2025" || /tidak ditemukan/i.test(msg)) {
      return notFound(msg);
    }
    if (/sudah ada/i.test(msg)) {
      return conflict(msg);
    }
    return badRequest(msg);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = getApplicationManager();

  try {
    const res = await app.coin.service.deleteHard(id);
    return json(res, 200);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal menghapus coin";
    if (e?.code === "P2025" || /tidak ditemukan/i.test(msg)) {
      return notFound(msg);
    }
    return badRequest(msg);
  }
}
