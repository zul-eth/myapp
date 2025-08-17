import { z } from "zod";

export const ExchangeRateCreateSchema = z.object({
  buyCoinId: z.string().uuid("buyCoinId harus uuid"),
  buyNetworkId: z.string().uuid("buyNetworkId harus uuid"),
  payCoinId: z.string().uuid("payCoinId harus uuid"),
  payNetworkId: z.string().uuid("payNetworkId harus uuid"),
  rate: z.number().positive("rate harus > 0"),
  updatedBy: z.string().trim().max(64).optional(),
});

export const ExchangeRateUpdateSchema = z.object({
  rate: z.number().positive("rate harus > 0").optional(),
  updatedBy: z.string().trim().max(64).optional(),
});
