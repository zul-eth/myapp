'use server';

import 'server-only';
import { dbToRuntimeChain } from '@/lib/hdwallet/chainMap';
import { generateAddress } from '@/lib/hdwallet/universal';
import { getMnemonic } from '@/server/crypto/mnemonic';
import { allocHdIndexes } from '@/server/repositories/hdCursor.repo';
import { insertWalletPoolRows } from '@/server/repositories/walletPool.repo';

export async function deriveAndStoreAddresses(params: {
  chain: 'evm' | 'tron' | 'solana'; count: number;
}) {
  const { chain, count } = params;
  const mnemonic = getMnemonic();
  const runtimeChain = dbToRuntimeChain(chain);

  const indexes = await allocHdIndexes(chain, count);
  const rows = [];
  for (const idx of indexes) {
    const address = await generateAddress(runtimeChain, mnemonic, idx);
    rows.push({ chain, derivationIndex: idx, address });
  }
  return insertWalletPoolRows(rows);
}

export async function previewDerivedAddress(params: {
  chain: 'evm' | 'tron' | 'solana'; index: number;
}) {
  const { chain, index } = params;
  const mnemonic = getMnemonic();
  const runtimeChain = dbToRuntimeChain(chain);
  const address = await generateAddress(runtimeChain, mnemonic, index);
  return { chain, index, address };
}
