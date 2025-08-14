import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  const coins = await app.coin.service.listAll();
  return NextResponse.json(coins);
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json();
  const { symbol, name, logoUrl } = body; // ✅ Tidak ada id
  const created = await app.coin.service.create({ symbol, name, logoUrl });
  return NextResponse.json(created, { status: 201 });
}
