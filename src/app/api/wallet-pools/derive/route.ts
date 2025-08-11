import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { dbToRuntimeChain } from '@/lib/hdwallet/chainMap';
import { generateAddress } from '@/lib/hdwallet/universal';

const prisma = new PrismaClient();

/**
 * POST /api/wallet-pools/derive
 * body: { chain: 'evm'|'tron'|'solana', count?: number }
 * Generate N alamat dan catat ke WalletPoolLegacy (isUsed=false, belum assigned).
 */
export async function POST(req: Request) {
  try {
    const { chain, count } = await req.json();
    if (!chain || !['evm', 'tron', 'solana'].includes(chain)) {
      return NextResponse.json({ message: 'chain harus evm|tron|solana' }, { status: 400 });
    }
    const n = Math.max(1, Math.min(Number(count || 1), 100));

    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic) return NextResponse.json({ message: 'MNEMONIC belum dikonfigurasi' }, { status: 500 });

    const runtimeChain = dbToRuntimeChain(chain);

    // Ambil base index dari HdCursor secara atomik
    const result = await prisma.$transaction(async (tx) => {
      const cur = await tx.hdCursor.upsert({
        where: { chain },
        update: { nextIndex: { increment: n } },
        create: { chain, nextIndex: n },
      });
      const start = cur.nextIndex - n;
      const targets = Array.from({ length: n }, (_, i) => start + i);

      const created: any[] = [];
      for (const idx of targets) {
        const addr = await generateAddress(runtimeChain as any, mnemonic, idx);
        // bisa bentrok jika address sudah ada — tangani dengan try/catch
        try {
          const row = await tx.walletPoolLegacy.create({
            data: {
              chain,
              derivationIndex: idx,
              address: addr,
              isUsed: false,
              assignedOrder: null,
            },
          });
          created.push(row);
        } catch (e: any) {
          if (e?.code === 'P2002') {
            // sudah ada (race) — lewati; index berikutnya masih tercatat di cursor
            continue;
          }
          throw e;
        }
      }
      return created;
    });

    if (result.length === 0) {
      return NextResponse.json({ message: 'Tidak bisa generate alamat baru' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Wallets generated', wallets: result });
  } catch (error) {
    console.error('POST /api/wallet-pools/derive error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
