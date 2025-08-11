// src/lib/hdwallet/chainMap.ts
export type DbChain = 'evm' | 'tron' | 'solana';
export type RuntimeChain = 'eth' | 'tron' | 'solana';

export function dbToRuntimeChain(dbChain: DbChain): RuntimeChain {
  return dbChain === 'evm' ? 'eth' : dbChain;
}
