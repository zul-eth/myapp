import { getApplicationManager } from "@/core";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const app = getApplicationManager();
  const { searchParams } = new URL(req.url);
  const coinId = searchParams.get("coinId");
  const networkId = searchParams.get("networkId");

  if (!coinId || !networkId) {
    return new Response(JSON.stringify({ error: "coinId and networkId required" }), { status: 400 });
  }

  const addr = await app.wallet.service.getPaymentAddress(coinId, networkId);
  if (!addr.ok) {
    return new Response(JSON.stringify({ error: addr.error.message }), { status: 404 });
  }

  return new Response(JSON.stringify({ address: addr.value }), { status: 200 });
}
