// src/types/network.ts
import { Coin } from './coin';

export type Network = {
  id: string;
  name: string;
  logoUrl?: string;
  coins: Coin[];
};