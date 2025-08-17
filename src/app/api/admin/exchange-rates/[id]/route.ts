import { getApplicationManager } from "@/core";
import { ExchangeRateUpdateSchema } from "@/lib/validation/exchange-rate";
import { badRequest, json, notFound } from "@/lib/http/responses";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = ExchangeRateUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");

  try {
    const updated = await app.exchangeRate.service.update(id, parsed.data);
    return json(updated, 200);
  } catch (e: any) {
    if (e.code === "P2025") return notFound("Exchange rate tidak ditemukan");
    return badRequest(e?.message ?? "Gagal mengubah exchange rate");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  try {
    const res = await app.exchangeRate.service.delete(id);
    return json(res, 200);
  } catch (e: any) {
    if (e.code === "P2025") return notFound("Exchange rate tidak ditemukan");
    return badRequest(e?.message ?? "Gagal menghapus exchange rate");
  }
}
