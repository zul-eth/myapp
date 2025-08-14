import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const app = getApplicationManager();
  const body = await req.json();
  const updated = await app.coin.service.update(params.id, body);
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplicationManager();
  try {
    await app.coin.service.delete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete coin error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


