import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  const coins = await app.coin.service.listAll();
  return NextResponse.json(coins);
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const { symbol, name, logoUrl } = await req.json();

  if (!symbol || !name) {
    return NextResponse.json({ error: "Symbol dan Name wajib diisi" }, { status: 400 });
  }

  try {
    const created = await app.coin.service.create({ symbol, name, logoUrl });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e.message.includes("sudah ada")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
