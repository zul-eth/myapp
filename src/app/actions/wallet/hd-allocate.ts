"use server";

import { prisma } from "@/lib/prisma";
import { generateAddress, type UniversalChain } from "@/lib/hdwallet/universal";

/**
 * Catatan:
 * - ENV `WALLET_MNEMONIC` harus ada di server (JANGAN expose ke client).
 * - Fungsi ini dipanggil dari service server-side, bukan dari klien langsung.
 */
export async function hdAllocateNew(chain: UniversalChain): Promise<{ index: number; address: string }> {
  const MNEMONIC = process.env.WALLET_MNEMONIC;
  if (!MNEMONIC) throw new Error("WALLET_MNEMONIC belum di-set");

  // buat cursor jika belum ada
  const cursor = await prisma.hdCursor.upsert({
    where: { chain },
    update: {},
    create: { chain, nextIndex: 0 },
  });

  const index = cursor.nextIndex;

  // derive address (semua akses mnemonic terjadi di Server Action ini)
  const address = await generateAddress(chain, MNEMONIC, index);

  // advance cursor
  await prisma.hdCursor.update({
    where: { chain },
    data: { nextIndex: index + 1, lastUsedAt: new Date() },
  });

  return { index, address };
}
