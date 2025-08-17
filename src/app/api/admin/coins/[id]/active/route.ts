import { getApplicationManager } from "@/core";
import { ToggleActiveSchema } from "@/lib/validation/coin";
import { badRequest, json, notFound } from "@/lib/http/responses";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const parsed = ToggleActiveSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Input tidak valid";
    return badRequest(msg);
  }

  const app = getApplicationManager();
  try {
    const updated = await app.coin.service.toggleActive(id, parsed.data.isActive);
    return json(updated, 200);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal mengubah status";
    if (/tidak ditemukan/i.test(msg)) return notFound(msg);
    return badRequest(msg);
  }
}
