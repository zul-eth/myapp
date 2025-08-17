import { z } from "zod";
import { ChainFamily } from "@prisma/client";

export const SYMBOL_RE = /^[A-Z0-9_-]{2,20}$/;

export const NetworkCreateSchema = z.object({
  symbol: z.string().trim().toUpperCase().regex(SYMBOL_RE, "Format symbol tidak valid (2-20, A-Z/0-9/_/-)"),
  name: z.string().trim().min(2, "Nama terlalu pendek"),
  family: z.nativeEnum(ChainFamily, { errorMap: () => ({ message: "family tidak valid" }) }),
  isActive: z.boolean().optional(),
});

export const NetworkUpdateSchema = z.object({
  symbol: z.string().trim().toUpperCase().regex(SYMBOL_RE, "Format symbol tidak valid").optional(),
  name: z.string().trim().min(2, "Nama terlalu pendek").optional(),
  family: z.nativeEnum(ChainFamily).optional(),
  isActive: z.boolean().optional(),
});

export const ToggleActiveSchema = z.object({
  isActive: z.boolean({ required_error: "isActive harus boolean" }),
});
