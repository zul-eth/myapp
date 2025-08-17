import { z } from "zod";

export const SYMBOL_RE = /^[A-Z0-9_-]{2,15}$/;

export const CoinCreateSchema = z.object({
  symbol: z.string().trim().toUpperCase().regex(SYMBOL_RE, "Format symbol tidak valid (2-15, A-Z/0-9/_/-)"),
  name: z.string().trim().min(2, "Nama terlalu pendek"),
  logoUrl: z
    .string()
    .url("Logo URL tidak valid")
    .max(1024)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const CoinUpdateSchema = z.object({
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .regex(SYMBOL_RE, "Format symbol tidak valid (2-15, A-Z/0-9/_/-)")
    .optional(),
  name: z.string().trim().min(2, "Nama terlalu pendek").optional(),
  logoUrl: z
    .string()
    .url("Logo URL tidak valid")
    .max(1024)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  isActive: z.boolean().optional(),
});

export const ToggleActiveSchema = z.object({
  isActive: z.boolean({ required_error: "isActive harus boolean" }),
});
