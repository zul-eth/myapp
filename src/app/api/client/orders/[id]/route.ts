import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const app = getApplicationManager();
  const { id } = await ctx.params;              // ⬅️ unwrap
  try {
    const order = await app.order.service.get(id);
    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const app = getApplicationManager();
  const patch = await req.json();
  const { id } = await ctx.params;              // ⬅️ unwrap
  try {
    const updated = await app.order.service.update(id, patch);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
