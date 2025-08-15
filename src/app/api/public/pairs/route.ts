import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  try {
    const pairs = await app.exchangeRate.repository.prisma.exchangeRate.findMany({
      where: {
        buyCoinId: { not: null },
        buyNetworkId: { not: null },
        payCoinId: { not: null },
        payNetworkId: { not: null }
      },
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true
      },
      orderBy: { createdAt: "desc" }
    });

    const formatted = pairs
      .filter(p => p.buyCoin && p.buyNetwork && p.payCoin && p.payNetwork) // pastikan semua relasi ada
      .map(p => ({
        id: p.id,
        buyCoinId: p.buyCoin.id,
        buyCoinSymbol: p.buyCoin.symbol,
        buyCoinName: p.buyCoin.name,
        buyNetworkId: p.buyNetwork.id,
        buyNetworkName: p.buyNetwork.name,
        payCoinId: p.payCoin.id,
        payCoinSymbol: p.payCoin.symbol,
        payCoinName: p.payCoin.name,
        payNetworkId: p.payNetwork.id,
        payNetworkName: p.payNetwork.name,
        rate: p.rate
      }));

    return NextResponse.json(formatted);
  } catch (e: any) {
    console.error("Error GET /api/public/pairs:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
