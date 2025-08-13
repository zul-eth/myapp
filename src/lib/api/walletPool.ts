// HANYA tipe & util ringan TANPA impor Server Actions.
// Supaya modul ini aman dipakai di client tanpa bikin Next bingung.

export type WalletPoolRow = {
  id: string;
  chain: 'evm' | 'tron' | 'solana';
  derivationIndex: number;
  address: string;
  isUsed: boolean;
  assignedOrder: number | null;
  createdAt: string | Date;
};
