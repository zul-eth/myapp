import { getApplicationManager } from "@/core";
import { PaymentOptionUpdateSchema } from "@/lib/validation/payment-option";
import { badRequest, json, notFound } from "@/lib/http/responses";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = PaymentOptionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Input tidak valid";
    return badRequest(msg);
  }

  try {
    const updated = await app.paymentOption.service.update(id, parsed.data);
    return json(updated, 200);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound("PaymentOption tidak ditemukan");
    return badRequest(e?.message ?? "Gagal mengubah payment option");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  try {
    const res = await app.paymentOption.service.delete(id);
    return json(res, 200);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound("PaymentOption tidak ditemukan");
    return badRequest(e?.message ?? "Gagal menghapus payment option");
  }
}
