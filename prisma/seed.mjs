import { PrismaClient } from "@prisma/client";
import { runSeed } from "../src/lib/seed/seed-core.ts"; // tsx loader memungkinkan import TS

const prisma = new PrismaClient();

async function main() {
  await runSeed(prisma);
  console.log("✅ Seed selesai.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
