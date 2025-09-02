import { getApplicationManager } from "@/core";
import { CoinNetworkCreateSchema } from "@/lib/validation/coin-network";
import { badRequest, conflict, json } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  const app = getApplicationManager();
  return json(await app.coinNetwork.service.listAll());
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = CoinNetworkCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");

  try {
    const created = await app.coinNetwork.service.create(parsed.data);
    return json(created, 201);
  } catch (e: any) {
    // Unique ([coinId, networkId])
    if (e.code === "P2002" || /unique/i.test(String(e?.message))) {
      return conflict("Relasi coin-network sudah ada");
    }
    return badRequest(e?.message ?? "Gagal membuat relasi");
  }
}


