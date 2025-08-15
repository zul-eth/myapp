// src/app/api/client/orders/route.ts
import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json();
  const { pairId, amount, receivingAddr, receivingMemo } = body ?? {};

  const required = { pairId, amount, receivingAddr };
  for (const [k, v] of Object.entries(required)) {
    if (!v && v !== 0) {
      return NextResponse.json({ error: `${k} wajib diisi` }, { status: 400 });
    }
  }

  try {
    const order = await app.order.service.create({
      pairId: String(pairId),
      amount: Number(amount),
      receivingAddr: String(receivingAddr),
      receivingMemo: receivingMemo ?? null
    });
    return NextResponse.json(order, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
