import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  return NextResponse.json(await app.exchangeRate.service.listAll());
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json();

  if (!body.buyCoinId || !body.buyNetworkId || !body.payCoinId || !body.payNetworkId || !body.rate) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }

  try {
    const created = await app.exchangeRate.service.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e.message.includes("sudah ada")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
