import { getApplicationManager } from "@/core";
import { ExchangeRateCreateSchema } from "@/lib/validation/exchange-rate";
import { badRequest, conflict, json } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  const app = getApplicationManager();
  return json(await app.exchangeRate.service.listAll());
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = ExchangeRateCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");

  try {
    const created = await app.exchangeRate.service.create(parsed.data);
    return json(created, 201);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal membuat exchange rate";
    if (/sudah ada/i.test(msg) || e.code === "P2002") return conflict(msg);
    return badRequest(msg);
  }
}
