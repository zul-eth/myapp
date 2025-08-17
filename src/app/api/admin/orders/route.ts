import { getApplicationManager } from "@/core";
import { json } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  const app = getApplicationManager();
  const rows = await app.order.service.listAll();
  return json(rows, 200);
}
