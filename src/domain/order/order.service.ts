import { OrderRepositoryPrisma } from "./order.repository";
import { OrderStatus } from "@prisma/client";

export class OrderService {
  constructor(private readonly repo: OrderRepositoryPrisma) {}

  async listAll(params?: any) {
    return this.repo.listAll(params);
  }

  async getDetail(id: string) {
    const order = await this.repo.findById(id);
    if (!order) throw new Error("Order tidak ditemukan");
    return order;
  }

  async create(data: any) {
    // Validasi logis di sini
    if (data.coinToBuyId === data.payWithId && data.buyNetworkId === data.payNetworkId) {
      throw new Error("Buy dan Pay tidak boleh sama pada network yang sama");
    }
    data.status = OrderStatus.PENDING;
    return this.repo.createOrder(data);
  }

  async update(id: string, data: any) {
    return this.repo.updateOrder(id, data);
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.repo.updateOrder(id, { status });
  }

  async delete(id: string) {
    return this.repo.deleteOrder(id);
  }

  async listByClient(clientId: string) {
    return this.repo.listByClient(clientId);
  }
}
