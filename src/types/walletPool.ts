// src/types/walletPoolLegacy.ts

export type WalletPool = {
  id: string;
  chain: 'evm' | 'tron' | 'solana';
  derivationIndex: number;
  address: string;

  isUsed: boolean;
  assignedOrder?: string | null;
  createdAt: string;
};
