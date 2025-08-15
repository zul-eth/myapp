import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";
import { OrderStatus } from "@prisma/client";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;            // ⬅️ unwrap
    const { status } = await req.json();
    const app = getApplicationManager();
    const updatedOrder = await app.order.service.setStatus(id, status as OrderStatus);
    return NextResponse.json({ ok: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
