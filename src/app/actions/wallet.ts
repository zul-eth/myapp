"use server";

import { prisma } from "@/lib/prisma";
import { generateAddress } from "@/lib/hdwallet/universal";
import { ChainFamily } from "@prisma/client";

export async function generateNewAddress(chain: ChainFamily) {
  const mnemonic = process.env.WALLET_MNEMONIC;
  if (!mnemonic) throw new Error("WALLET_MNEMONIC not set");

  // Ambil HdCursor untuk chain ini
  let cursor = await prisma.hdCursor.findUnique({ where: { chain } });
  if (!cursor) {
    cursor = await prisma.hdCursor.create({
      data: { chain, nextIndex: 0 }
    });
  }

  const index = cursor.nextIndex;
  const { address } = await generateAddress(chain, mnemonic, index);

  // Simpan ke pool
  const pool = await prisma.walletPoolLegacy.create({
    data: {
      chain,
      derivationIndex: index,
      address,
      isUsed: false
    }
  });

  // Update cursor
  await prisma.hdCursor.update({
    where: { id: cursor.id },
    data: { nextIndex: index + 1, lastUsedAt: new Date() }
  });

  return pool;
}
