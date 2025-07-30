const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const eth = await prisma.network.upsert({
    where: { name: 'Ethereum' },
    update: {},
    create: {
      name: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    }
  });

  const shib = await prisma.coin.upsert({
    where: { symbol: 'SHIB' },
    update: {},
    create: {
      symbol: 'SHIB',
      name: 'Shiba Inu',
      logoUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png',
    }
  });

  await prisma.coinNetwork.upsert({
    where: {
      coinId_networkId: {
        coinId: shib.id,
        networkId: eth.id
      }
    },
    update: {},
    create: {
      coinId: shib.id,
      networkId: eth.id,
      isActive: true
    }
  });

  await prisma.paymentOption.create({
    data: {
      coinId: shib.id,
      networkId: eth.id,
      isActive: true
    }
  });

  console.log('Seed selesai 🚀');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });