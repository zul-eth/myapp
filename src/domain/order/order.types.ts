export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED";

export type Order = {
  id: string;
  buyCoinId: string; buyNetworkId: string;
  payCoinId: string; payNetworkId: string;
  buyAmount: string | number;
  payAmount: string | number;
  priceRate: string | number;
  address: string;           // input user
  receivingAddr: string;     // kolom DB wajib
  paymentAddr: string;       // ⬅️ kolom DB wajib (alamat pembayaran ke kita)
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateOrderDTO = {
  id?: string;
  buyCoinId: string; buyNetworkId: string;
  payCoinId: string; payNetworkId: string;
  buyAmount: string | number;
  address: string;
  receivingAddr?: string;    // auto = address
  paymentAddr?: string;      // auto dari wallet
  status?: OrderStatus;
};

export type UpdateOrderDTO = Partial<CreateOrderDTO> & { status?: OrderStatus };
