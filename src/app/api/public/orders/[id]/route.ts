import { getApplicationManager } from "@/core";
import { OrderCancelSchema } from "@/lib/validation/order";
import { badRequest, json, notFound } from "@/lib/http/responses";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  const order = await app.order.service.getById(id);
  if (!order) return notFound("Order tidak ditemukan");
  return json(order, 200);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = OrderCancelSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");
  const app = getApplicationManager();
  try {
    const updated = await app.order.service.cancel(id);
    return json(updated, 200);
  } catch (e: any) {
    return badRequest(e?.message ?? "Gagal membatalkan order");
  }
}
