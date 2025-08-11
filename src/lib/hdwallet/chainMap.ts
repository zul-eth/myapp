// src/lib/hdwallet/chainMap.ts
export type DbChain = 'evm' | 'tron' | 'solana';
// universal.ts (HD wallet) biasanya pakai 'eth' untuk EVM
export type RuntimeChain = 'eth' | 'tron' | 'solana';

/** Kembalikan pasangan chain untuk DB & HD runtime */
export function mapNetworkToChains(networkName: string): { dbChain: DbChain; runtimeChain: RuntimeChain } {
  const n = networkName.trim().toLowerCase();

  if (n.includes('tron') || n === 'trx') return { dbChain: 'tron', runtimeChain: 'tron' };
  if (n.includes('solana') || n === 'sol') return { dbChain: 'solana', runtimeChain: 'solana' };

  // default: semua EVM (ETH, BSC/BEP20, Polygon, Arbitrum, OP, Base, AVAX-C, dst.)
  return { dbChain: 'evm', runtimeChain: 'eth' };
}
