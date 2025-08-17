import { getApplicationManager } from "@/core";
import { json } from "@/lib/http/responses";

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const family = searchParams.get("family")?.toUpperCase() || undefined; // ChainFamily
  const symbol = searchParams.get("symbol")?.toUpperCase() || undefined;

  const app = getApplicationManager();

  // gunakan listAll() atau listActive() yang sudah ada; kita pastikan publik hanya aktif
  const all = await app.network.service.listAll();
  const active = all.filter((n: any) => n.isActive);

  const filtered = active.filter((n: any) => {
    if (family && String(n.family).toUpperCase() !== family) return false;
    if (symbol && String(n.symbol).toUpperCase() !== symbol) return false;
    return true;
  });

  return json(filtered, 200);
}
