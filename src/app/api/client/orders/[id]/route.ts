import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  try {
    const order = await app.order.service.getDetail(id);
    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}
