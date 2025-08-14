export type ExchangeRate = { id: string; buyCoinId: string; buyNetworkId: string; payCoinId: string; payNetworkId: string; rate: number; asOf?: string };
export type CreateExchangeRateDTO = Omit<ExchangeRate,"id"> & { id?: string };
export type UpdateExchangeRateDTO = Partial<CreateExchangeRateDTO>;
