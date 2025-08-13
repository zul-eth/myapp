'use server';

import 'server-only';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
