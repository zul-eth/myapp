import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  return NextResponse.json(await app.coinNetwork.service.listAll());
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json();

  if (!body.coinId || !body.networkId) {
    return NextResponse.json({ error: "Coin dan Network wajib dipilih" }, { status: 400 });
  }

  try {
    const created = await app.coinNetwork.service.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e.message.includes("sudah ada")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
