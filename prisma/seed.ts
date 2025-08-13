import { PrismaClient, ChainFamily, AssetType, MemoKind } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Coins penting
  const coins = await Promise.all([
    ['ETH','Ether'], ['USDT','Tether USD'], ['USDC','USD Coin'], ['DAI','Dai'],
    ['TRX','TRON'], ['SOL','Solana'], ['XRP','XRP'],
    ['DOGE','Dogecoin'], ['LTC','Litecoin'], ['TON','Toncoin'],
    ['SUI','Sui'], ['EOS','EOS'], ['MATIC','Polygon'], ['BNB','BNB']
  ].map(([symbol,name]) => prisma.coin.upsert({
    where: { symbol }, update: {}, create: { symbol, name }
  })));

  const bySymbol = (s: string) => coins.find(c => c.symbol === s)!;

  // Networks (EVM & non‑EVM)
  const nets = await Promise.all([
    { name: 'ETHEREUM', family: ChainFamily.EVM,   chainId: '1',    symbol: 'ETH' },
    { name: 'BASE',     family: ChainFamily.EVM,   chainId: '8453', symbol: 'ETH' },
    { name: 'OPTIMISM', family: ChainFamily.EVM,   chainId: '10',   symbol: 'ETH' },
    { name: 'ARBITRUM', family: ChainFamily.EVM,   chainId: '42161',symbol: 'ETH' },
    { name: 'POLYGON',  family: ChainFamily.EVM,   chainId: '137',  symbol: 'MATIC' },
    { name: 'BSC',      family: ChainFamily.EVM,   chainId: '56',   symbol: 'BNB' },

    { name: 'TRON',     family: ChainFamily.TRON,  symbol: 'TRX' },
    { name: 'SOLANA',   family: ChainFamily.SOLANA,symbol: 'SOL' },
    { name: 'XRP',      family: ChainFamily.XRP,   symbol: 'XRP' },
    { name: 'DOGE',     family: ChainFamily.DOGE,  symbol: 'DOGE' },
    { name: 'LTC',      family: ChainFamily.LTC,   symbol: 'LTC' },
    { name: 'TON',      family: ChainFamily.TON,   symbol: 'TON' },
    { name: 'SUI',      family: ChainFamily.SUI,   symbol: 'SUI' },
    { name: 'EOS',      family: ChainFamily.EOS,   symbol: 'EOS' },
  ].map(n => prisma.network.upsert({ where: { name: n.name }, update: {}, create: n as any })));

  const netByName = (n: string) => nets.find(x => x.name === n)!;

  // CoinNetwork mappings + metadata
  const entries: Array<Parameters<typeof prisma.coinNetwork.upsert>[0]> = [];

  // EVM Native
  ['ETHEREUM','BASE','OPTIMISM','ARBITRUM','POLYGON','BSC'].forEach(n=>{
    const sym = n === 'POLYGON' ? 'MATIC' : (n === 'BSC' ? 'BNB' : 'ETH');
    entries.push({
      where: { coinId_networkId: { coinId: bySymbol(sym).id, networkId: netByName(n).id } },
      update: {},
      create: { coinId: bySymbol(sym).id, networkId: netByName(n).id, assetType: AssetType.NATIVE, decimals: 18 }
    });
  });

  // EVM ERC20 — isi alamat kontrak sesuai kebutuhanmu (placeholder)
  const ERC20 = [
    // [symbol, network, contract, decimals]
    ['USDT','ETHEREUM','0xdAC17F958D2ee523a2206206994597C13D831ec7',6],
    ['USDC','ETHEREUM','0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',6],
    ['DAI','ETHEREUM','0x6B175474E89094C44Da98b954EedeAC495271d0F',18],
    // Tambahkan BASE/OP/ARB/POL/BSC kontrak sesuai real data mu
  ] as const;

  ERC20.forEach(([sym, net, addr, dec]) => {
    entries.push({
      where: { coinId_networkId: { coinId: bySymbol(sym).id, networkId: netByName(net).id } },
      update: {},
      create: {
        coinId: bySymbol(sym).id, networkId: netByName(net).id,
        assetType: AssetType.EVM_ERC20, contractAddress: addr, decimals: dec
      }
    });
  });

  // Non‑EVM Native only
  [
    ['TRX','TRON',6, MemoKind.NONE],
    ['SOL','SOLANA',9, MemoKind.NONE],
    ['XRP','XRP',6, MemoKind.XRP_TAG], // butuh tag
    ['DOGE','DOGE',8, MemoKind.NONE],
    ['LTC','LTC',8, MemoKind.NONE],
    ['TON','TON',9, MemoKind.TON_TEXT], // comment opsional
    ['SUI','SUI',9, MemoKind.NONE],
    ['EOS','EOS',4, MemoKind.EOS_TEXT], // memo text
  ].forEach(([sym, net, dec, memo])=>{
    entries.push({
      where: { coinId_networkId: { coinId: bySymbol(sym as string).id, networkId: netByName(net as string).id } },
      update: {},
      create: {
        coinId: bySymbol(sym as string).id, networkId: netByName(net as string).id,
        assetType: AssetType.NATIVE, decimals: dec as number,
        memoKind: memo as MemoKind,
        memoLabel: memo === MemoKind.XRP_TAG ? 'Destination tag' :
                   memo === MemoKind.EOS_TEXT ? 'Memo' :
                   memo === MemoKind.TON_TEXT ? 'Comment' : undefined
      }
    });
  });

  for (const e of entries) await prisma.coinNetwork.upsert(e);

  // PaymentOption operasional (contoh aktifkan ETH & USDT di BASE)
  await prisma.paymentOption.upsert({
    where: { coinId_networkId: { coinId: bySymbol('ETH').id, networkId: netByName('BASE').id } },
    update: { isActive: true },
    create: { coinId: bySymbol('ETH').id, networkId: netByName('BASE').id, isActive: true }
  });
  await prisma.paymentOption.upsert({
    where: { coinId_networkId: { coinId: bySymbol('USDT').id, networkId: netByName('BASE').id } },
    update: { isActive: true },
    create: { coinId: bySymbol('USDT').id, networkId: netByName('BASE').id, isActive: true }
  });
}

main().finally(()=>prisma.$disconnect());