import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * GET /api/wallet-pools?chain&isUsed&q&limit
 * Sumber data: WalletPoolLegacy
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chain = searchParams.get('chain') || undefined; // 'evm'|'tron'|'solana'
    const isUsed = searchParams.get('isUsed') || undefined; // 'true'|'false'
    const q = searchParams.get('q') || undefined;
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

    const where: any = {};
    if (chain) where.chain = chain;
    if (isUsed === 'true') where.isUsed = true;
    if (isUsed === 'false') where.isUsed = false;
    if (q) {
      where.OR = [
        { address: { contains: q, mode: 'insensitive' } },
        { assignedOrder: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await prisma.walletPoolLegacy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/wallet-pools error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// NOTE: POST lama (manual address) DIHAPUS. Gunakan /derive untuk generate.
