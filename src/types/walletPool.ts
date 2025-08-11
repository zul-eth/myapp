// src/types/walletPool.ts
export type WalletPool = {
  id: string;
  coinId: string;
  networkId: string;
  address: string;
  xpub?: string | null;
  isUsed: boolean;
  assignedOrder?: string | null;
  createdAt: string;

  coin: { id: string; symbol: string; name: string; logoUrl?: string | null };
  network: { id: string; name: string; logoUrl?: string | null };
};
