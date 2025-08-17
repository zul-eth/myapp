"use server";

import { prisma } from "@/lib/prisma";
import { ChainFamily } from "@prisma/client";
import { deriveAddress } from "@/lib/hdwallet"; // -> gunakan lib hdwallet kamu

/**
 * Isi pool alamat untuk network tertentu dengan batch baru.
 * count default 10 agar ada buffer.
 */
export async function topUpWalletPool(opts: { networkId: string; count?: number }) {
  const { networkId, count = 10 } = opts;

  const network = await prisma.network.findUnique({ where: { id: networkId } });
  if (!network) throw new Error("Network tidak ditemukan");
  const chain = network.family as ChainFamily;

  // cursor per chain (bukan per network) – sesuai schema HdCursor(chain)
  let cursor = await prisma.hdCursor.findUnique({ where: { chain } });
  if (!cursor) {
    cursor = await prisma.hdCursor.create({ data: { chain, nextIndex: 0 } });
  }

  const rows: { chain: string; derivationIndex: number; networkId: string; address: string }[] = [];

  // derive alamat via lib/hdwallet (server-only)
  for (let i = 0; i < count; i++) {
    const index = cursor.nextIndex + i;
    const address = await deriveAddress({
      family: chain,
      index,
      network,        // kirim objek network jika lib/hdwallet membutuhkannya (rpc/chainId, dll.)
    });
    rows.push({ chain, derivationIndex: index, networkId, address });
  }

  await prisma.$transaction(async (tx) => {
    await tx.walletPoolLegacy.createMany({
      data: rows.map((r) => ({
        chain: r.chain,
        derivationIndex: r.derivationIndex,
        networkId: r.networkId,
        address: r.address,
        isUsed: false,
      })),
      skipDuplicates: true,
    });

    await tx.hdCursor.update({
      where: { id: cursor!.id },
      data: { nextIndex: cursor!.nextIndex + count, lastUsedAt: new Date() },
    });
  });

  return rows.length;
}

/**
 * Ganti alamat invoice untuk order yang masih WAITING_PAYMENT.
 * - melepas alamat lama (jika ada)
 * - mengambil alamat baru dari pool (top-up otomatis bila perlu)
 */
export async function regenerateInvoiceAddress(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) throw new Error("Order tidak ditemukan");
  if (order.status !== "WAITING_PAYMENT") throw new Error("Hanya order WAITING_PAYMENT yang bisa ganti alamat");

  // ambil network bayar
  const net = await prisma.network.findUnique({ where: { id: order.payNetworkId } });
  if (!net) throw new Error("Network pembayaran tidak ditemukan");

  // cari/siapkan alamat baru
  let candidate = await prisma.walletPoolLegacy.findFirst({
    where: { isUsed: false, networkId: order.payNetworkId },
    orderBy: [{ derivationIndex: "asc" }, { createdAt: "asc" }],
  });
  if (!candidate) {
    await topUpWalletPool({ networkId: order.payNetworkId, count: 10 });
    candidate = await prisma.walletPoolLegacy.findFirst({
      where: { isUsed: false, networkId: order.payNetworkId },
      orderBy: [{ derivationIndex: "asc" }, { createdAt: "asc" }],
    });
  }
  if (!candidate) throw new Error("Pool alamat habis");

  await prisma.$transaction(async (tx) => {
    // lepas alamat lama
    const poolOld = await tx.walletPoolLegacy.findFirst({ where: { assignedOrderId: order.id } });
    if (poolOld) {
      await tx.walletPoolLegacy.update({
        where: { id: poolOld.id },
        data: { isUsed: false, assignedOrderId: null },
      });
    }

    // gunakan kandidat baru
    await tx.walletPoolLegacy.update({
      where: { id: candidate!.id },
      data: { isUsed: true, assignedOrderId: order.id, networkId: order.payNetworkId },
    });

    // update order & payment
    await tx.order.update({
      where: { id: order.id },
      data: { paymentAddr: candidate!.address, paymentMemo: order.paymentMemo ?? null },
    });
    if (order.payment) {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: { payToAddress: candidate!.address },
      });
    }
  });

  return true;
}
