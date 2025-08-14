import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  return NextResponse.json(await app.network.service.listAll());
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const { name, logoUrl, family, chainId, symbol, rpcUrl, explorer } = await req.json();

  if (!name || !family) {
    return NextResponse.json({ error: "Name dan Family wajib diisi" }, { status: 400 });
  }

  try {
    const created = await app.network.service.create({
      name, logoUrl, family, chainId, symbol, rpcUrl, explorer
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e.message.includes("sudah ada")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
