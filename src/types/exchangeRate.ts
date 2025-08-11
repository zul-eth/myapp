// src/types/exchangeRate.ts
export type ExchangeRate = {
  id: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string | null;

  buyCoin: { id: string; symbol: string; name: string; logoUrl?: string | null };
  buyNetwork: { id: string; name: string; logoUrl?: string | null };
  payCoin: { id: string; symbol: string; name: string; logoUrl?: string | null };
  payNetwork: { id: string; name: string; logoUrl?: string | null };
};
