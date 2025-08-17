import { getApplicationManager } from "@/core";
import { json } from "@/lib/http/responses";

// cache ringan untuk publik; ubah sesuai kebutuhan
export const revalidate = 60;

export async function GET() {
  const app = getApplicationManager();
  const coins = await app.coin.service.listActive();
  return json(coins);
}
