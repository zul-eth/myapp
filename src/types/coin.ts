// src/types/coin.ts

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  logoUrl?: string;
  networks: {
    id: string;
    name: string;
    logoUrl?: string;
  }[];
}