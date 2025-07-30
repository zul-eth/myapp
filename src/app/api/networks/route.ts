// src/app/api/networks/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const networks = await prisma.network.findMany({
      where: { isActive: true },
      include: {
        coins: {
          where: { isActive: true },
          include: {
            coin: true
          }
        }
      }
    });

    const result = networks.map(network => ({
      id: network.id,
      name: network.name,
      logoUrl: network.logoUrl,
      coins: network.coins.map(c => ({
        id: c.coin.id,
        symbol: c.coin.symbol,
        name: c.coin.name,
        logoUrl: c.coin.logoUrl
      }))
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching networks:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// src/app/api/networks/route.ts
export async function POST(req: Request) {
  try {
    const { name, logoUrl } = await req.json();

    if (!name) {
      return NextResponse.json({ message: "name is required" }, { status: 400 });
    }

    const network = await prisma.network.create({
      data: {
        name,
        logoUrl,
        isActive: true
      }
    });

    return NextResponse.json({ message: "Network created", network });
  } catch (error) {
    console.error("POST /api/networks error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}