// src/types/paymentOption.ts
export type PaymentOption = {
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
