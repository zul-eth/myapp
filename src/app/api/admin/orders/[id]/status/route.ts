import { getApplicationManager } from "@/core";
import { OrderUpdateStatusSchema } from "@/lib/validation/order";
import { badRequest, json, notFound } from "@/lib/http/responses";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = OrderUpdateStatusSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");

  const app = getApplicationManager();
  try {
    const row = await app.order.service.updateStatus(id, parsed.data.status);
    if (!row) return notFound("Order tidak ditemukan");
    return json(row, 200);
  } catch (e: any) {
    return badRequest(e?.message ?? "Gagal mengubah status");
  }
}
