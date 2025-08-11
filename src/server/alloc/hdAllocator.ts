// src/server/alloc/hdAllocator.ts
import { PrismaClient } from '@prisma/client';
import { generateAddress } from '@/lib/hdwallet/universal';
import { mapNetworkToChains } from '@/lib/hdwallet/chainMap';

const prisma = new PrismaClient();

/**
 * Alokasikan 1 alamat pembayaran berbasis CHAIN (evm/tron/solana).
 * - increment atomik HdCursor.nextIndex
 * - derive alamat dari index
 * - catat ledger ke WalletPoolLegacy (isUsed=true, assignedOrder=orderId)
 * - set paymentAddr pada Order
 */
export async function allocatePaymentAddressByChain(params: {
  payWithId: string;   // Coin ID yang dipakai bayar (tidak dipakai di versi per-chain, tapi disimpan untuk validasi)
  payNetworkId: string;
  orderId: string;
}) {
  const { payWithId, payNetworkId, orderId } = params;

  const [payCoin, payNetwork, order] = await Promise.all([
    prisma.coin.findUnique({ where: { id: payWithId } }),
    prisma.network.findUnique({ where: { id: payNetworkId } }),
    prisma.order.findUnique({ where: { id: orderId } }),
  ]);
  if (!payCoin || !payNetwork) throw new Error('Coin/Network not found');
  if (!order) throw new Error('Order not found');

  const { dbChain, runtimeChain } = mapNetworkToChains(payNetwork.name);
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) throw new Error('MNEMONIC belum dikonfigurasi');

  // retry kecil untuk handle unique violation (sangat jarang)
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1) ambil index secara atomik
        const cur = await tx.hdCursor.upsert({
          where: { chain: dbChain },
          update: { nextIndex: { increment: 1 } },
          create: { chain: dbChain, nextIndex: 1 },
        });
        const indexAssigned = cur.nextIndex - 1;

        // 2) derive alamat dari index
        const address = await generateAddress(runtimeChain as any, mnemonic, indexAssigned);

        // 3) ledger + set order
        await tx.walletPoolLegacy.create({
          data: {
            chain: dbChain,
            derivationIndex: indexAssigned,
            address,
            isUsed: true,
            assignedOrder: orderId,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: { paymentAddr: address },
        });

        return { chain: dbChain, indexAssigned, address };
      });

      return result; // success
    } catch (e: any) {
      if (e?.code === 'P2002') continue; // unique violation → retry
      throw e;
    }
  }

  throw new Error('Gagal mengalokasikan alamat unik; coba lagi');
}
