import { z } from "zod";

export const createOrderSchema = z.object({
  buyCoinId: z.string().min(1),
  buyNetworkId: z.string().min(1),
  payCoinId: z.string().min(1),
  payNetworkId: z.string().min(1),
  buyAmount: z.union([z.string(), z.number()]).refine(v => Number(v) > 0, "buyAmount must be > 0"),
  address: z.string().min(6),
  receivingAddr: z.string().min(6).optional(),
  paymentAddr: z.string().min(6).optional(),
  status: z.enum(["PENDING","PAID","DELIVERED","CANCELLED"]).optional(),
});

export const updateOrderSchema = createOrderSchema.partial();
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
