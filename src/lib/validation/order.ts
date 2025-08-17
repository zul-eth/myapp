import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const sym = z.string().trim().min(2).max(32);

export const OrderCreateFlexibleSchema = z.object({
  // BUY — boleh id(UUID) atau symbol
  coinToBuyId: z.union([z.string().uuid(), sym]).optional(),
  coinToBuySymbol: sym.optional(),
  buyNetworkId: z.union([z.string().uuid(), sym]).optional(),
  buyNetworkSymbol: sym.optional(),
  buyNetworkName: z.string().trim().min(2).max(64).optional(),

  // PAY — 3 cara:
  paymentOptionId: z.string().uuid().optional(),
  payPair: z.string().regex(/^[A-Za-z0-9_\-\.]+:[A-Za-z0-9_\-\.]+$/).optional(),
  payWithId: z.union([z.string().uuid(), sym]).optional(),
  payWithSymbol: sym.optional(),
  payNetworkId: z.union([z.string().uuid(), sym]).optional(),
  payNetworkSymbol: sym.optional(),
  payNetworkName: z.string().trim().min(2).max(64).optional(),

  amount: z.number().positive("amount harus > 0"),
  receivingAddr: z.string().trim().min(1, "receivingAddr wajib"),
  receivingMemo: z.string().trim().max(120).optional(),
  expiresInMinutes: z.number().int().min(5).max(24 * 60).optional(),
}).refine((d) => {
  const hasBuy =
    !!(d.coinToBuyId || d.coinToBuySymbol) &&
    !!(d.buyNetworkId || d.buyNetworkSymbol || d.buyNetworkName);

  const hasPay =
    !!d.paymentOptionId ||
    !!d.payPair ||
    ((d.payWithId || d.payWithSymbol) &&
      (d.payNetworkId || d.payNetworkSymbol || d.payNetworkName));

  return hasBuy && hasPay;
}, { message: "Lengkapi buy coin+network dan salah satu opsi pay (paymentOptionId | payPair | id/symbol)" });

// STRICT tetap sama (tetap uuid semua)…
export const OrderCreateStrictSchema = z.object({
  coinToBuyId: z.string().uuid(),
  buyNetworkId: z.string().uuid(),
  payWithId: z.string().uuid(),
  payNetworkId: z.string().uuid(),
  amount: z.number().positive("amount harus > 0"),
  receivingAddr: z.string().trim().min(1, "receivingAddr wajib"),
  receivingMemo: z.string().trim().max(120).optional(),
  expiresInMinutes: z.number().int().min(5).max(24 * 60).optional(),
});

export const OrderUpdateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().trim().max(256).optional(),
});

export const OrderCancelSchema = z.object({
  reason: z.string().trim().max(256).optional(),
});
