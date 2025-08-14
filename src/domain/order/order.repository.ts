import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { Order } from "./order.types";

export interface IOrderRepository {
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  create(data: Order): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order>;
}

export class OrderRepositoryPrisma implements IOrderRepository {
  async list() {
    return prisma.order.findMany();
  }

  async get(id: string) {
    return prisma.order.findUnique({ where: { id } });
  }

  async create(data: Order) {
    return prisma.order.create({ data });
  }

  async update(id: string, data: Partial<Order>) {
    const exist = await prisma.order.findUnique({ where: { id } });
    if (!exist) throw new NotFoundError("Order not found");
    return prisma.order.update({ where: { id }, data });
  }
}
