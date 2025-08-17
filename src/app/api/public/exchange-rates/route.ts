import { getApplicationManager } from "@/core";
import { json } from "@/lib/http/responses";

export const revalidate = 60;

function up(s?: string | null) {
  return typeof s === "string" ? s.trim().toUpperCase() : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // dukung filter by id atau symbol (semua opsional)
  const buyCoinId = searchParams.get("buyCoinId") || undefined;
  const buyNetworkId = searchParams.get("buyNetworkId") || undefined;
  const payCoinId = searchParams.get("payCoinId") || undefined;
  const payNetworkId = searchParams.get("payNetworkId") || undefined;

  const buyCoinSymbol = up(searchParams.get("buyCoinSymbol"));
  const buyNetworkSymbol = up(searchParams.get("buyNetworkSymbol"));
  const payCoinSymbol = up(searchParams.get("payCoinSymbol"));
  const payNetworkSymbol = up(searchParams.get("payNetworkSymbol"));

  const app = getApplicationManager();
  // ambil lengkap lalu filter di route (drop-in tanpa ubah repo/service)
  const rows = await app.exchangeRate.service.listAll();

  const filtered = rows.filter((r: any) => {
    if (buyCoinId && r.buyCoin?.id !== buyCoinId) return false;
    if (buyNetworkId && r.buyNetwork?.id !== buyNetworkId) return false;
    if (payCoinId && r.payCoin?.id !== payCoinId) return false;
    if (payNetworkId && r.payNetwork?.id !== payNetworkId) return false;

    if (buyCoinSymbol && String(r.buyCoin?.symbol).toUpperCase() !== buyCoinSymbol) return false;
    if (buyNetworkSymbol && String(r.buyNetwork?.symbol).toUpperCase() !== buyNetworkSymbol) return false;
    if (payCoinSymbol && String(r.payCoin?.symbol).toUpperCase() !== payCoinSymbol) return false;
    if (payNetworkSymbol && String(r.payNetwork?.symbol).toUpperCase() !== payNetworkSymbol) return false;

    return true;
  });

  // urutkan terbaru dulu (kalau ada updatedAt)
  filtered.sort((a: any, b: any) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  });

  return json(filtered, 200);
}
