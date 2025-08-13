'use server';

import 'server-only';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type WalletPoolRow = {
  id: string;
  chain: 'evm' | 'tron' | 'solana';
  derivationIndex: number;
  address: string;
  isUsed: boolean;
  assignedOrder: number | null;
  createdAt: Date;
};

export async function allocHdIndexes(chain: string, count: number) {
  return prisma.$transaction(async (tx) => {
    const cur = await tx.hdCursor.upsert({
      where: { chain },
      update: { nextIndex: { increment: count } },
      create: { chain, nextIndex: count },
    });
    const start = cur.nextIndex - count;
    return Array.from({ length: count }, (_, i) => start + i);
  });
}

export async function insertWalletPoolRows(rows: {
  chain: string; derivationIndex: number; address: string;
}[]) {
  const created: WalletPoolRow[] = [];
  for (const r of rows) {
    try {
      const row = await prisma.walletPoolLegacy.create({
        data: { ...r, isUsed: false, assignedOrder: null },
      });
      created.push(row as unknown as WalletPoolRow);
    } catch (e: any) {
      if (e?.code !== 'P2002') throw e; // unique conflict → skip
    }
  }
  return created;
}

export async function listWalletPools(params: {
  chain?: 'evm' | 'tron' | 'solana';
  take?: number;                 // default 50
  cursor?: string | null;        // cursor = id baris terakhir (pagination ke bawah)
}) {
  const { chain, take = 50, cursor } = params;
  const where = chain ? { chain } : {};
  const rows = await prisma.walletPoolLegacy.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  return rows as unknown as WalletPoolRow[];
}

export async function countWalletPools(params?: { chain?: 'evm' | 'tron' | 'solana' }) {
  const where = params?.chain ? { chain: params.chain } : {};
  return prisma.walletPoolLegacy.count({ where });
}
