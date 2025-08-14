import { getApplicationManager } from "@/core";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  const data = await req.json();
  const updated = await app.network.service.update(params.id, data);
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  await app.network.service.delete(params.id);
  return NextResponse.json({ success: true });
}
