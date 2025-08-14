import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  try {
    const updated = await app.coinNetwork.service.update(id, await req.json());
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "CoinNetwork tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  try {
    return NextResponse.json(await app.coinNetwork.service.delete(id));
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ success: true, type: "not-found", message: "CoinNetwork tidak ditemukan" }, { status: 200 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
