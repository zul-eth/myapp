import { getApplicationManager } from "@/core";
import { json } from "@/lib/http/responses";

export const revalidate = 60;

const up = (s: string | null) => (s ? s.trim().toUpperCase() : undefined);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // PAY-side (opsional, seperti sebelumnya)
  const coinId = searchParams.get("coinId") || undefined;
  const networkId = searchParams.get("networkId") || undefined;
  const coinSymbol = up(searchParams.get("coinSymbol"));
  const networkSymbol = up(searchParams.get("networkSymbol"));

  // BUY-side (baru, opsional)
  const buyCoinId = searchParams.get("buyCoinId") || undefined;
  const buyNetworkId = searchParams.get("buyNetworkId") || undefined;
  const buyCoinSymbol = up(searchParams.get("buyCoinSymbol"));
  const buyNetworkSymbol = up(searchParams.get("buyNetworkSymbol"));

  const app = getApplicationManager();

  const rows = await app.paymentOption.service.listActive({
    coinId,
    networkId,
    coinSymbol,
    networkSymbol,
    buyCoinId,
    buyNetworkId,
    buyCoinSymbol,
    buyNetworkSymbol,
  });

  return json(rows, 200);
}
