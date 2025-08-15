// src/app/api/client/orders/route.ts
import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json();

  const required = ["pairId", "amount", "receivingAddr"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} wajib diisi` }, { status: 400 });
    }
  }

  // Ambil pair langsung dari ExchangeRate
  const pair = await app.exchangeRate.repository.prisma.exchangeRate.findUnique({
    where: { id: body.pairId },
    include: { buyCoin: true, buyNetwork: true, payCoin: true, payNetwork: true }
  });

  if (!pair) {
    return NextResponse.json({ error: "Pair tidak ditemukan" }, { status: 400 });
  }

  const orderData = {
    coinToBuyId: pair.buyCoinId,
    buyNetworkId: pair.buyNetworkId,
    payWithId: pair.payCoinId,
    payNetworkId: pair.payNetworkId,
    amount: Number(body.amount),
    priceRate: pair.rate,
    receivingAddr: body.receivingAddr,
    receivingMemo: body.receivingMemo || null
  };

  try {
    const order = await app.order.service.create(orderData);
    return NextResponse.json(order, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
