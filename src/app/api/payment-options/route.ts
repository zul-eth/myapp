// src/app/api/payment-options/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * GET /api/payment-options
 * Query:
 * - q?: string  (filter by coin.symbol/name atau network.name)
 * - active?: 'true' | 'false' (default true)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const activeParam = searchParams.get('active') ?? 'true';

    const where: any = {};
    if (activeParam === 'true') where.isActive = true;
    if (activeParam === 'false') where.isActive = false;

    if (q) {
      where.OR = [
        { coin: { symbol: { contains: q, mode: 'insensitive' } } },
        { coin: { name: { contains: q, mode: 'insensitive' } } },
        { network: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // hanya coin & network yang aktif
    where.coin = { ...(where.coin || {}), isActive: true };
    where.network = { ...(where.network || {}), isActive: true };

    const rows = await prisma.paymentOption.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { coin: true, network: true },
    });

    // UI mengharapkan array langsung
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/payment-options error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/payment-options
 * Body: { coinId: string, networkId: string }
 * - Jika kombinasi sudah ada & nonaktif → aktifkan lagi
 * - Jika belum ada → buat baru (aktif)
 */
export async function POST(req: NextRequest) {
  try {
    const { coinId, networkId } = await req.json();

    if (!coinId || !networkId) {
      return NextResponse.json({ message: 'Field wajib belum lengkap' }, { status: 400 });
    }

    // cek apakah sudah ada (unik di schema: @@unique([coinId, networkId]))
    const existing = await prisma.paymentOption.findUnique({
      where: { coinId_networkId: { coinId, networkId } },
      include: { coin: true, network: true },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { message: 'Payment option sudah ada & aktif', paymentOption: existing },
          { status: 200 }
        );
      }
      const reactivated = await prisma.paymentOption.update({
        where: { id: existing.id },
        data: { isActive: true },
        include: { coin: true, network: true },
      });
      return NextResponse.json(
        { message: 'Payment option diaktifkan kembali', paymentOption: reactivated },
        { status: 200 }
      );
    }

    // buat baru
    const created = await prisma.paymentOption.create({
      data: { coinId, networkId, isActive: true },
      include: { coin: true, network: true },
    });

    return NextResponse.json(
      { message: 'Payment option created', paymentOption: created },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/payment-options error:', error);
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 });
  }
}
