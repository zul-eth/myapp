import { getApplicationManager } from "@/core";
import { json, notFound } from "@/lib/http/responses";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  const row = await app.order.service.getById(id);
  if (!row) return notFound("Order tidak ditemukan");
  return json(row, 200);
}
