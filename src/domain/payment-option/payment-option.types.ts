export type PaymentOption = { id: string; coinId: string; networkId: string; isActive: boolean; };
export type CreatePaymentOptionDTO = Omit<PaymentOption, "id"> & { id?: string };
export type UpdatePaymentOptionDTO = Partial<CreatePaymentOptionDTO>;
