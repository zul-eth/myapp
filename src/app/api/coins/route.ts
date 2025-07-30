//src/app/api/coins/route.ts

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const coins = await prisma.coin.findMany({
      where: { isActive: true },
      include: {
        networks: {
          where: { isActive: true },
          include: {
            network: true
          }
        }
      }
    });

    const result = coins.map(coin => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      logoUrl: coin.logoUrl,
      networks: coin.networks.map(n => ({
        id: n.network.id,
        name: n.network.name,
        logoUrl: n.network.logoUrl
      }))
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching coins:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symbol, name, logoUrl } = body;

    if (!symbol || !name) {
      return NextResponse.json({ message: "symbol and name are required" }, { status: 400 });
    }

    const coin = await prisma.coin.upsert({
      where: { symbol },
      update: { name, logoUrl },
      create: { symbol, name, logoUrl }
    });

    return NextResponse.json({ message: "Coin created", coin });
  } catch (error) {
    console.error("POST /api/coins error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}