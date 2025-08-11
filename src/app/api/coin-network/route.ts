// src/app/api/coin-network/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET api/coin-network — Lihat semua relasi
export async function GET() {
  try {
    const relations = await prisma.coinNetwork.findMany({
      include: { coin: true, network: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(relations);
  } catch (error) {
    console.error('GET /api/coin-network error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST api/coin-network — Hubungkan coin ↔ network
export async function POST(req: NextRequest) {
  try {
    const { coinId, networkId } = await req.json();

    if (!coinId || !networkId) {
      return NextResponse.json({ message: 'coinId dan networkId wajib diisi' }, { status: 400 });
    }

    // pastikan coin & network ada
    const [coin, network] = await Promise.all([
      prisma.coin.findUnique({ where: { id: coinId } }),
      prisma.network.findUnique({ where: { id: networkId } }),
    ]);
    if (!coin || !network) {
      return NextResponse.json({ message: 'Coin atau Network tidak ditemukan' }, { status: 404 });
    }

    // cek unik
    const exists = await prisma.coinNetwork.findUnique({
      where: { coinId_networkId: { coinId, networkId } },
    });
    if (exists) {
      return NextResponse.json({ message: 'Relasi sudah ada' }, { status: 409 });
    }

    const relation = await prisma.coinNetwork.create({
      data: {
        coin: { connect: { id: coinId } },
        network: { connect: { id: networkId } },
      },
      include: { coin: true, network: true },
    });

    return NextResponse.json({ message: 'Relation created', relation });
  } catch (error) {
    console.error('POST /api/coin-network error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
