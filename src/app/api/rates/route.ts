// src/app/api/rates/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * GET /api/rates
 * Query:
 * - q?: string   -> cari di coin.symbol / coin.name / network.name / id
 *
 * Response: ExchangeRate[] (array langsung), include relasi.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;

    const where: any = {};
    if (q) {
      where.OR = [
        { buyCoin: { symbol: { contains: q, mode: 'insensitive' } } },
        { buyCoin: { name: { contains: q, mode: 'insensitive' } } },
        { buyNetwork: { name: { contains: q, mode: 'insensitive' } } },
        { payCoin: { symbol: { contains: q, mode: 'insensitive' } } },
        { payCoin: { name: { contains: q, mode: 'insensitive' } } },
        { payNetwork: { name: { contains: q, mode: 'insensitive' } } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rates = await prisma.exchangeRate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true,
      },
    });

    return NextResponse.json(rates);
  } catch (error) {
    console.error('GET /api/rates error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/rates
 * body: { buyCoinId, buyNetworkId, payCoinId, payNetworkId, rate, updatedBy? }
 * Upsert by unique 4 kolom. Saat upsert, set rate & updatedBy.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buyCoinId, buyNetworkId, payCoinId, payNetworkId, rate } = body || {};
    const actor =
      body?.updatedBy ||
      req.headers.get('x-actor') ||
      req.headers.get('x-admin') ||
      null;

    if (!buyCoinId || !buyNetworkId || !payCoinId || !payNetworkId || rate == null) {
      return NextResponse.json(
        { message: 'buyCoinId, buyNetworkId, payCoinId, payNetworkId, dan rate wajib diisi' },
        { status: 400 }
      );
    }

    const parsedRate = Number(rate);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      return NextResponse.json({ message: 'Rate tidak valid' }, { status: 400 });
    }

    // Validasi entitas ada
    const [buyCoin, buyNetwork, payCoin, payNetwork] = await Promise.all([
      prisma.coin.findUnique({ where: { id: buyCoinId } }),
      prisma.network.findUnique({ where: { id: buyNetworkId } }),
      prisma.coin.findUnique({ where: { id: payCoinId } }),
      prisma.network.findUnique({ where: { id: payNetworkId } }),
    ]);
    if (!buyCoin || !buyNetwork || !payCoin || !payNetwork) {
      return NextResponse.json({ message: 'Coin atau Network tidak ditemukan' }, { status: 404 });
    }

    const rateRow = await prisma.exchangeRate.upsert({
      where: {
        buyCoinId_buyNetworkId_payCoinId_payNetworkId: {
          buyCoinId,
          buyNetworkId,
          payCoinId,
          payNetworkId,
        },
      },
      update: { rate: parsedRate, updatedBy: actor || undefined },
      create: {
        buyCoinId,
        buyNetworkId,
        payCoinId,
        payNetworkId,
        rate: parsedRate,
        updatedBy: actor || undefined,
      },
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true,
      },
    });

    return NextResponse.json({ message: 'Rate saved', rate: rateRow });
  } catch (error) {
    console.error('POST /api/rates error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
