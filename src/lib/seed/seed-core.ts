// Reusable seed core yang bisa dipakai di test (mock prisma) dan produksi (PrismaClient asli)
export type SeedPrisma = {
  coin: {
    findUnique(args: any): Promise<any>;
    findFirst(args: any): Promise<any>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
  };
  network: {
    findUnique(args: any): Promise<any>;
    findFirst(args: any): Promise<any>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
  };
  coinNetwork: {
    findFirst(args: any): Promise<any>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
  };
  exchangeRate: {
    findFirst(args: any): Promise<any>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
  };
};

async function getNetworkBySymbolOrName(prisma: SeedPrisma, key: string) {
  const byName = await prisma.network.findUnique({ where: { name: key } }).catch(() => null);
  if (byName) return byName;
  const bySymbol = await prisma.network.findFirst({ where: { symbol: key } }).catch(() => null);
  return bySymbol;
}

async function getCoinBySymbolOrName(prisma: SeedPrisma, key: string) {
  const bySymbol = await prisma.coin.findUnique({ where: { symbol: key } }).catch(() => null);
  if (bySymbol) return bySymbol;
  const byName = await prisma.coin.findFirst({ where: { name: key } }).catch(() => null);
  return byName;
}

async function ensureCoin(prisma: SeedPrisma, symbol: string, name: string) {
  const existing = await prisma.coin.findUnique({ where: { symbol } }).catch(() => null);
  if (existing) return existing;
  return prisma.coin.create({ data: { symbol, name } });
}

async function ensureNetwork(
  prisma: SeedPrisma,
  opts: { symbol: string; name: string; family: string; isActive?: boolean }
) {
  const { symbol, name, family, isActive = true } = opts;
  let existing = await prisma.network.findUnique({ where: { name } }).catch(() => null);
  if (!existing) {
    existing = await prisma.network.findFirst({ where: { symbol } }).catch(() => null);
  }
  if (existing) {
    return prisma.network.update({ where: { id: existing.id }, data: { symbol, name, family, isActive } });
  }
  return prisma.network.create({ data: { symbol, name, family, isActive } });
}

async function ensureCoinNetwork(
  prisma: SeedPrisma,
  opts: {
    coinKey: string;
    networkKey: string;
    assetType?: string;
    contractAddress?: string | null;
    decimals?: number | null;
    symbolOverride?: string | null;
    memoKind?: string;
    memoLabel?: string | null;
    memoRegex?: string | null;
    isActive?: boolean;
  }
) {
  const {
    coinKey,
    networkKey,
    assetType = "NATIVE",
    contractAddress = null,
    decimals = null,
    symbolOverride = null,
    memoKind = "NONE",
    memoLabel = null,
    memoRegex = null,
    isActive = true,
  } = opts;

  const coin = await getCoinBySymbolOrName(prisma, coinKey);
  const network = await getNetworkBySymbolOrName(prisma, networkKey);
  if (!coin || !network) throw new Error(`Missing coin/network: ${coinKey}/${networkKey}`);

  const existing = await prisma.coinNetwork.findFirst({
    where: { coinId: coin.id, networkId: network.id },
  });

  if (existing) {
    return prisma.coinNetwork.update({
      where: { id: existing.id },
      data: { assetType, contractAddress, decimals, symbolOverride, memoKind, memoLabel, memoRegex, isActive },
    });
  }
  return prisma.coinNetwork.create({
    data: {
      coinId: coin.id,
      networkId: network.id,
      assetType,
      contractAddress,
      decimals,
      symbolOverride,
      memoKind,
      memoLabel,
      memoRegex,
      isActive,
    },
  });
}

async function ensureRate(
  prisma: SeedPrisma,
  opts: {
    buyCoinKey: string;
    buyNetworkKey: string;
    payCoinKey: string;
    payNetworkKey: string;
    rate: number;
    updatedBy?: string | null;
  }
) {
  const { buyCoinKey, buyNetworkKey, payCoinKey, payNetworkKey, rate, updatedBy = "seed" } = opts;

  const buyCoin = await getCoinBySymbolOrName(prisma, buyCoinKey);
  const buyNetwork = await getNetworkBySymbolOrName(prisma, buyNetworkKey);
  const payCoin = await getCoinBySymbolOrName(prisma, payCoinKey);
  const payNetwork = await getNetworkBySymbolOrName(prisma, payNetworkKey);
  if (!buyCoin || !buyNetwork || !payCoin || !payNetwork) {
    throw new Error(`Missing pair parts: ${buyCoinKey}/${buyNetworkKey} vs ${payCoinKey}/${payNetworkKey}`);
  }

  const existing = await prisma.exchangeRate.findFirst({
    where: {
      buyCoinId: buyCoin.id,
      buyNetworkId: buyNetwork.id,
      payCoinId: payCoin.id,
      payNetworkId: payNetwork.id,
    },
  });

  if (existing) {
    return prisma.exchangeRate.update({ where: { id: existing.id }, data: { rate, updatedBy } });
  }
  return prisma.exchangeRate.create({
    data: {
      buyCoinId: buyCoin.id,
      buyNetworkId: buyNetwork.id,
      payCoinId: payCoin.id,
      payNetworkId: payNetwork.id,
      rate,
      updatedBy,
    },
  });
}

/** Jalankan seed dan kembalikan ringkasan count untuk keperluan test */
export async function runSeed(prisma: SeedPrisma) {
  // Coins
  const coins: [string, string][] = [
    ["BTC", "Bitcoin"],
    ["ETH", "Ethereum"],
    ["USDT", "Tether USD"],
    ["TRX", "Tron"],
    ["SOL", "Solana"],
    ["XRP", "XRP"],
  ];
  for (const [symbol, name] of coins) await ensureCoin(prisma, symbol, name);

  // Networks (gunakan "name" sbg unique utama; symbol bisa non-unique)
  await ensureNetwork(prisma, { symbol: "ETH", name: "Ethereum", family: "EVM", isActive: true });
  await ensureNetwork(prisma, { symbol: "ARB", name: "Arbitrum", family: "EVM", isActive: true });
  await ensureNetwork(prisma, { symbol: "BASE", name: "Base", family: "EVM", isActive: true });
  await ensureNetwork(prisma, { symbol: "TRON", name: "Tron", family: "TRON", isActive: true });
  await ensureNetwork(prisma, { symbol: "SOL", name: "Solana", family: "SOLANA", isActive: true });
  await ensureNetwork(prisma, { symbol: "XRP", name: "XRP Ledger", family: "XRP", isActive: true });

  // CoinNetworks
  await ensureCoinNetwork(prisma, { coinKey: "ETH", networkKey: "Ethereum", assetType: "NATIVE", decimals: 18 });
  await ensureCoinNetwork(prisma, { coinKey: "TRX", networkKey: "Tron", assetType: "NATIVE", decimals: 6 });
  await ensureCoinNetwork(prisma, { coinKey: "SOL", networkKey: "Solana", assetType: "NATIVE", decimals: 9 });
  await ensureCoinNetwork(prisma, { coinKey: "XRP", networkKey: "XRP Ledger", assetType: "NATIVE", decimals: 6, memoKind: "XRP_TAG", memoLabel: "Destination Tag" });

  await ensureCoinNetwork(prisma, { coinKey: "USDT", networkKey: "Ethereum", assetType: "EVM_ERC20", decimals: 6 });
  await ensureCoinNetwork(prisma, { coinKey: "USDT", networkKey: "Arbitrum", assetType: "EVM_ERC20", decimals: 6 });
  await ensureCoinNetwork(prisma, { coinKey: "USDT", networkKey: "Base", assetType: "EVM_ERC20", decimals: 6 });
  await ensureCoinNetwork(prisma, { coinKey: "USDT", networkKey: "Tron", assetType: "OTHER", decimals: 6 });

  // ExchangeRates
  await ensureRate(prisma, { buyCoinKey: "ETH", buyNetworkKey: "Ethereum", payCoinKey: "USDT", payNetworkKey: "Ethereum", rate: 3500 });
  await ensureRate(prisma, { buyCoinKey: "TRX", buyNetworkKey: "Tron", payCoinKey: "USDT", payNetworkKey: "Tron", rate: 0.12 });
  await ensureRate(prisma, { buyCoinKey: "SOL", buyNetworkKey: "Solana", payCoinKey: "USDT", payNetworkKey: "Ethereum", rate: 150 });
  await ensureRate(prisma, { buyCoinKey: "XRP", buyNetworkKey: "XRP Ledger", payCoinKey: "USDT", payNetworkKey: "Ethereum", rate: 0.6 });

  // Ringkasan (biar test bisa asert jumlahnya)
  return {
    expected: {
      coins: 6,
      networks: 6,
      coinNetworks: 8,
      exchangeRates: 4,
    },
  };
}
