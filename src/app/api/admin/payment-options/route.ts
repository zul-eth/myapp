import { getApplicationManager } from "@/core";
import { PaymentOptionCreateSchema } from "@/lib/validation/payment-option";
import { badRequest, conflict, json } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  const app = getApplicationManager();
  const rows = await app.paymentOption.service.listAll();
  return json(rows);
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = PaymentOptionCreateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Input tidak valid";
    return badRequest(msg);
  }

  try {
    const created = await app.paymentOption.service.create(parsed.data);
    return json(created, 201);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal membuat payment option";
    if (/sudah ada/i.test(msg) || e?.code === "P2002") return conflict(msg);
    return badRequest(msg);
  }
}
