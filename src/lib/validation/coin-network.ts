import { z } from "zod";
import { AssetType, MemoKind } from "@prisma/client";

export const CoinNetworkCreateSchema = z.object({
  coinId: z.string().uuid("coinId harus uuid"),
  networkId: z.string().uuid("networkId harus uuid"),

  assetType: z.nativeEnum(AssetType).default(AssetType.NATIVE),
  contractAddress: z.string().max(128).optional().or(z.literal("").transform(() => undefined)),
  decimals: z.number().int().min(0).max(36).optional(),
  symbolOverride: z.string().trim().min(1).max(32).optional(),

  memoKind: z.nativeEnum(MemoKind).default(MemoKind.NONE),
  memoLabel: z.string().trim().max(64).optional(),
  memoRegex: z.string().trim().max(256).optional(),

  isActive: z.boolean().optional(),
});

export const CoinNetworkUpdateSchema = CoinNetworkCreateSchema.partial().extend({
  // relasi tidak boleh diubah lewat update umum
  coinId: z.undefined(),
  networkId: z.undefined(),
});
