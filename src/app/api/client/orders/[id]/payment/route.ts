import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const app = getApplicationManager();
  try {
    const updated = await app.order.service.update(id, body);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
