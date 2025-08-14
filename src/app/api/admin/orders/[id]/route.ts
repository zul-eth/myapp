import { getApplicationManager } from "@/core";
import { NextRequest } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  const order = await app.order.service.get(params.id);
  if (!order) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return new Response(JSON.stringify(order), { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  const data = await req.json();
  const updated = await app.order.service.update(params.id, data);
  return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  await app.order.service.delete(params.id);
  return new Response(null, { status: 204 });
}
