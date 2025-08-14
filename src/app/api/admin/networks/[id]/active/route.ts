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
    return NextResponse.json(await app.network.service.toggleActive(id, isActive));
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Network tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
