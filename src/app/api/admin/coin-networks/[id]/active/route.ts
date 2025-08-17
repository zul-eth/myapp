import { getApplicationManager } from "@/core";
import { ToggleActiveSchema } from "@/lib/validation/network"; // schema boolean yang sama
import { badRequest, json, notFound } from "@/lib/http/responses";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = ToggleActiveSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");

  const app = getApplicationManager();
  try {
    const updated = await app.coinNetwork.service.toggleActive(id, parsed.data.isActive);
    return json(updated, 200);
  } catch (e: any) {
    if (e.code === "P2025") return notFound("Relasi tidak ditemukan");
    return badRequest(e?.message ?? "Gagal mengubah status");
  }
}
