import { getApplicationManager } from "@/core";
import { NextRequest } from "next/server";

export async function GET() {
  const app = getApplicationManager();
  return new Response(JSON.stringify(await app.exchangeRate.service.list()), { status: 200 });
}

export async function POST(req: NextRequest) {
  const app = getApplicationManager();
  const data = await req.json();
  const created = await app.exchangeRate.service.create(data);
  return new Response(JSON.stringify(created), { status: 201 });
}
