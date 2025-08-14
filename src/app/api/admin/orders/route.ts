import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  return new Response(JSON.stringify(await app.order.service.list()), { status: 200 });
}
