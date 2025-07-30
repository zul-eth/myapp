import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const buyCoinId = searchParams.get("buyCoinId");
  const buyNetworkId = searchParams.get("buyNetworkId");
  const payCoinId = searchParams.get("payCoinId");
  const payNetworkId = searchParams.get("payNetworkId");

  if (!buyCoinId || !buyNetworkId || !payCoinId || !payNetworkId) {
    return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
  }

  try {
    const rate = await prisma.exchangeRate.findUnique({
      where: {
        buyCoinId_buyNetworkId_payCoinId_payNetworkId: {
          buyCoinId,
          buyNetworkId,
          payCoinId,
          payNetworkId,
        },
      },
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true,
      },
    });

    if (!rate) {
      return NextResponse.json({ message: "Rate not found" }, { status: 404 });
    }

    return NextResponse.json({
      rate: rate.rate,
      buyCoin: rate.buyCoin.symbol,
      buyNetwork: rate.buyNetwork.name,
      payCoin: rate.payCoin.symbol,
      payNetwork: rate.payNetwork.name,
      updatedAt: rate.updatedAt,
      updatedBy: rate.updatedBy ?? null,
    });
  } catch (error) {
    console.error("GET /api/rates error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let {
      buyCoinId,
      buyNetworkId,
      payCoinId,
      payNetworkId,
      buyCoinSymbol,
      buyNetworkName,
      payCoinSymbol,
      payNetworkName,
      rate,
      updatedBy,
    } = body;

    if (!rate) {
      return NextResponse.json({ message: "Rate value is required" }, { status: 400 });
    }

    // Resolve IDs if symbols/names are provided
    if (!buyCoinId || !buyNetworkId || !payCoinId || !payNetworkId) {
      const [buyCoin, buyNetwork, payCoin, payNetwork] = await Promise.all([
        buyCoinId ? prisma.coin.findUnique({ where: { id: buyCoinId } }) : prisma.coin.findUnique({ where: { symbol: buyCoinSymbol } }),
        buyNetworkId ? prisma.network.findUnique({ where: { id: buyNetworkId } }) : prisma.network.findUnique({ where: { name: buyNetworkName } }),
        payCoinId ? prisma.coin.findUnique({ where: { id: payCoinId } }) : prisma.coin.findUnique({ where: { symbol: payCoinSymbol } }),
        payNetworkId ? prisma.network.findUnique({ where: { id: payNetworkId } }) : prisma.network.findUnique({ where: { name: payNetworkName } }),
      ]);

      if (!buyCoin || !buyNetwork || !payCoin || !payNetwork) {
        return NextResponse.json({ message: "Coin or network not found" }, { status: 404 });
      }

      buyCoinId = buyCoin.id;
      buyNetworkId = buyNetwork.id;
      payCoinId = payCoin.id;
      payNetworkId = payNetwork.id;
    }

    const upserted = await prisma.exchangeRate.upsert({
      where: {
        buyCoinId_buyNetworkId_payCoinId_payNetworkId: {
          buyCoinId,
          buyNetworkId,
          payCoinId,
          payNetworkId,
        },
      },
      update: {
        rate,
        updatedBy,
      },
      create: {
        rate,
        updatedBy,
        buyCoinId,
        buyNetworkId,
        payCoinId,
        payNetworkId,
      },
    });

    return NextResponse.json({
      message: "Rate saved",
      rate: upserted.rate,
      updatedAt: upserted.updatedAt,
    });
  } catch (error) {
    console.error("POST /api/rates error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}