import { getApplicationManager } from "@/core";
import { CoinCreateSchema } from "@/lib/validation/coin";
import { badRequest, conflict, json } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  const app = getApplicationManager();
  const coins = await app.coin.service.listAll();
  return json(coins);
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = CoinCreateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Input tidak valid";
    return badRequest(msg);
  }

  try {
    const created = await app.coin.service.create(parsed.data);
    return json(created, 201);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal membuat coin";
    if (/sudah ada/i.test(msg)) return conflict(msg);
    return badRequest(msg);
  }
}
