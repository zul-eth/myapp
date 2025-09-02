import { getApplicationManager } from "@/core";
import { badRequest, json, notFound } from "@/lib/http/responses";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const app = getApplicationManager();

  // Pastikan order ada
  const order = await app.order.service.getById(id);
  if (!order) return notFound("Order tidak ditemukan");

  try {
    const result = await app.payout.service.payoutOrder(id);
    return json(result, 200);
  } catch (e: any) {
    return badRequest(e?.message ?? "Gagal payout");
  }
}
