import type { Order as PrismaOrder, OrderStatus } from "@prisma/client";

export type OrderDTO = PrismaOrder; // gunakan tipe Prisma agar 1:1 dengan DB

// helper (dipakai di UI) untuk hitung jumlah bayar
export const computePayAmount = (buyAmount: number, priceRate: number) =>
  Number(buyAmount) * Number(priceRate);
