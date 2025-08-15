"use server";

import { prisma } from "@/lib/prisma";
import { generateAddress, type UniversalChain } from "@/lib/hdwallet/universal";
import { ChainFamily } from "@prisma/client";

function mapFamilyToUniversal(chain: ChainFamily): UniversalChain {
  switch (chain) {
    case "EVM": return "evm";
    case "TRON": return "tron";
    case "SOLANA": return "solana";
    case "EOS": return "eos";
    case "DOGE": return "doge";
    case "SUI": return "sui";
    case "LTC": return "ltc";
    case "TON": return "ton";
    // Catatan: XRP belum didukung universal.ts
    default: throw new Error(`Unsupported chain family: ${chain}`);
  }
}

export async function generateNewAddress(chain: ChainFamily) {
  const mnemonic = process.env.WALLET_MNEMONIC;
  if (!mnemonic) throw new Error("WALLET_MNEMONIC not set");

  // Cursor per family (disimpan sebagai nilai enum, mis. "EVM")
  let cursor = await prisma.hdCursor.findUnique({ where: { chain } });
  if (!cursor) {
    cursor = await prisma.hdCursor.create({ data: { chain, nextIndex: 0 } });
  }

  const index = cursor.nextIndex;

  // 🔧 Map enum → lowercase universal
  const uni: UniversalChain = mapFamilyToUniversal(chain);
  const address = await generateAddress(uni, mnemonic, index); // <- kembalian string

  // Simpan ke pool
  const pool = await prisma.walletPoolLegacy.create({
    data: { chain, derivationIndex: index, address, isUsed: false }
  });

  // Update cursor
  await prisma.hdCursor.update({
    where: { id: cursor.id },
    data: { nextIndex: index + 1, lastUsedAt: new Date() }
  });

  return pool;
}
