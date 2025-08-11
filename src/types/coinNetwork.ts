// src/types/coinNetwork.ts
export type CoinNetworkRelation = {
  id: string;
  isActive: boolean;
  createdAt: string;

  coin: {
    id: string;
    symbol: string;
    name: string;
    logoUrl?: string | null;
  };

  network: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
};
