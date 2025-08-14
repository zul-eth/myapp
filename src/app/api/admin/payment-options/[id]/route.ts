import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isActive } = await req.json();

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive harus boolean" }, { status: 400 });
  }

  const app = getApplicationManager();
  try {
    const updated = await app.paymentOption.service.update(id, { isActive });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  try {
    const deleted = await app.paymentOption.service.delete(id);
    return NextResponse.json(deleted);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
