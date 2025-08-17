import { getApplicationManager } from "@/core";
import { ToggleActiveSchema } from "@/lib/validation/network";
import { badRequest, json, notFound } from "@/lib/http/responses";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = ToggleActiveSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");

  try {
    const updated = await app.network.service.toggleActive(id, parsed.data.isActive);
    return json(updated, 200);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal mengubah status";
    if (/tidak ditemukan/i.test(msg)) return notFound(msg);
    return badRequest(msg);
  }
}
