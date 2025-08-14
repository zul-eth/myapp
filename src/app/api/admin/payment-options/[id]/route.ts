import { getApplicationManager } from "@/core";
import { NextRequest } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  const record = await app.paymentOption.service.get(params.id);
  if (!record) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return new Response(JSON.stringify(record), { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  const data = await req.json();
  const updated = await app.paymentOption.service.update(params.id, data);
  return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  await app.paymentOption.service.delete(params.id);
  return new Response(null, { status: 204 });
}
