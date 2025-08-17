import { getApplicationManager } from "@/core";
import { json } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

export async function POST() {
  const app = getApplicationManager();
  const out = await app.order.service.expireOverdue();
  return json(out, 200);
}
