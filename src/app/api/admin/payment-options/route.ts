import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  return NextResponse.json(await app.paymentOption.service.listAll());
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const { coinId, networkId } = await req.json();

  if (!coinId || !networkId) {
    return NextResponse.json({ error: "Coin dan Network wajib diisi" }, { status: 400 });
  }

  try {
    const created = await app.paymentOption.service.create({ coinId, networkId });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e.message.includes("sudah ada")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
