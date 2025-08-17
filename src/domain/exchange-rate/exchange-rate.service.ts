import { ExchangeRateRepositoryPrisma, CreateExchangeRateDTO, UpdateExchangeRateDTO } from "./exchange-rate.repository";

export class ExchangeRateService {
  constructor(private readonly repo: ExchangeRateRepositoryPrisma) {}

  listAll() {
    return this.repo.listAll();
  }

  async create(input: CreateExchangeRateDTO) {
    try {
      return await this.repo.create({ ...input, updatedBy: input.updatedBy ?? null });
    } catch (e: any) {
      if (e.code === "P2002") {
        throw new Error("Kombinasi (buyCoin,buyNetwork,payCoin,payNetwork) sudah ada");
      }
      throw e;
    }
  }

  update(id: string, input: UpdateExchangeRateDTO) {
    return this.repo.update(id, input);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
