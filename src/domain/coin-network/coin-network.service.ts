import { CoinNetworkRepositoryPrisma, CreateCoinNetworkDTO, UpdateCoinNetworkDTO } from "./coin-network.repository";

export class CoinNetworkService {
  constructor(private readonly repo: CoinNetworkRepositoryPrisma) {}

  listAll() {
    return this.repo.listAll();
  }

  create(input: CreateCoinNetworkDTO) {
    return this.repo.create({
      ...input,
      contractAddress: input.contractAddress ?? null,
      decimals: input.decimals ?? 18,
      symbolOverride: input.symbolOverride ?? null,
      memoLabel: input.memoLabel ?? null,
      memoRegex: input.memoRegex ?? null,
      isActive: input.isActive ?? true,
    });
  }

  update(id: string, input: UpdateCoinNetworkDTO) {
    return this.repo.update(id, input);
  }

  toggleActive(id: string, isActive: boolean) {
    return this.repo.toggleActive(id, isActive);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
