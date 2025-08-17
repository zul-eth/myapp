import { z } from "zod";

/**
 * Mengikuti model:
 * model PaymentOption {
 *   id        String @id @default(uuid())
 *   coinId    String
 *   networkId String
 *   isActive  Boolean @default(true)
 *   createdAt DateTime @default(now())
 *   @@unique([coinId, networkId])
 * }
 */

export const PaymentOptionCreateSchema = z.object({
  coinId: z.string().uuid("coinId harus uuid"),
  networkId: z.string().uuid("networkId harus uuid"),
  isActive: z.boolean().optional(),
});

export const PaymentOptionUpdateSchema = z.object({
  // coinId/networkId dibuat immutable lewat endpoint ini—hindari migrasi relasi tak disengaja
  isActive: z.boolean().optional(),
});
