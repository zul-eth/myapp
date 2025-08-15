// src/app/api/public/pairs/route.ts
import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  try {
    // Ambil semua pair lengkap relasinya
    const pairs = await app.exchangeRate.service.listAll();

    // Format respons yang lebih deskriptif untuk UI
    const formatted = pairs.map((p: any) => {
      const buy = {
        coin: {
          id: p.buyCoinId,
          symbol: p.buyCoin.symbol,
          name: p.buyCoin.name,
          logoUrl: p.buyCoin.logoUrl ?? null,
        },
        network: {
          id: p.buyNetworkId,
          name: p.buyNetwork.name,
          family: p.buyNetwork.family, // ChainFamily
        },
      };
      const pay = {
        coin: {
          id: p.payCoinId,
          symbol: p.payCoin.symbol,
          name: p.payCoin.name,
          logoUrl: p.payCoin.logoUrl ?? null,
        },
        network: {
          id: p.payNetworkId,
          name: p.payNetwork.name,
          family: p.payNetwork.family, // ChainFamily
        },
      };

      // Label panjang & pendek agar mudah dibaca di mobile
      const labelLong =
        `Beli ${buy.coin.symbol} di ${buy.network.name} • Bayar ${pay.coin.symbol} di ${pay.network.name} • ` +
        `1 ${buy.coin.symbol} = ${p.rate} ${pay.coin.symbol}`;
      const labelShort =
        `${buy.coin.symbol}/${pay.coin.symbol} • ${pay.network.name} • rate ${p.rate}`;

      return {
        id: p.id,
        rate: p.rate,
        buy,
        pay,
        labelLong,
        labelShort,
      };
    });

    return NextResponse.json(formatted);
  } catch (e: any) {
    console.error("Error GET /api/public/pairs:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
