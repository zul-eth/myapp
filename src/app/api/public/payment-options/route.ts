import { getApplicationManager } from "@/core";
import { json } from "@/lib/http/responses";

export const revalidate = 60;

const up = (s: string | null) => (s ? s.trim().toUpperCase() : undefined);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // filters (semua opsional)
  const coinId = searchParams.get("coinId") || undefined;
  const networkId = searchParams.get("networkId") || undefined;
  const coinSymbol = up(searchParams.get("coinSymbol"));
  const networkSymbol = up(searchParams.get("networkSymbol"));

  const app = getApplicationManager();

  // Penting: normalisasi dilakukan di ROUTE agar tetap berlaku saat service dimock di test
  const rows = await app.paymentOption.service.listActive({
    coinId,
    networkId,
    coinSymbol,
    networkSymbol,
  });

  return json(rows, 200);
}
