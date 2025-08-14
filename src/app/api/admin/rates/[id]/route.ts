import { getApplicationManager } from "@/core";
import { NextRequest } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  const rate = await app.exchangeRate.service.get(params.id);
  if (!rate) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return new Response(JSON.stringify(rate), { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  const data = await req.json();
  const updated = await app.exchangeRate.service.update(params.id, data);
  return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  await app.exchangeRate.service.delete(params.id);
  return new Response(null, { status: 204 });
}
