import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = getApplicationManager();
  const body = await req.json();

  try {
    const updated = await app.coin.service.update(id, body);
    return NextResponse.json(updated, { status: 200 });
  } catch (e: any) {
    if (e.message.includes("sudah ada")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Coin tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = getApplicationManager();

  try {
    const result = await app.coin.service.delete(id);
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json(
        { success: true, type: "not-found", message: "Coin tidak ditemukan di DB" },
        { status: 200 }
      );
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
