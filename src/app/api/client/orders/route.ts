import { getApplicationManager } from "@/core";
import { NextRequest } from "next/server";

export async function GET() {
  const app = getApplicationManager();
  return new Response(JSON.stringify(await app.order.service.list()), { status: 200 });
}

export async function POST(req: NextRequest) {
  const app = getApplicationManager();
  const data = await req.json();
  const result = await app.order.service.create(data);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error?.message }), { status: 400 });
  }
  return new Response(JSON.stringify(result.value), { status: 201 });
}
