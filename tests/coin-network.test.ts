import { POST, GET } from "@/app/api/coin-network/route";
import { PUT, DELETE } from "@/app/api/coin-network/[id]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let coinId: string;
let networkId: string;
let relationId: string;

beforeAll(async () => {
  const coin = await prisma.coin.create({ data: { name: "ZCoin", symbol: "ZC", isActive: true } });
  const network = await prisma.network.create({ data: { name: "ZNet", logoUrl: "-", isActive: true } });
  coinId = coin.id;
  networkId = network.id;
});

afterAll(async () => {
  await prisma.coinNetwork.deleteMany();
  await prisma.coin.deleteMany();
  await prisma.network.deleteMany();
  await prisma.$disconnect();
});

describe("API /api/coin-network", () => {
  it("GET: should return list of coin-network relations", async () => {
    const res = await GET();
    const json = await res.json();

    expect(Array.isArray(json)).toBe(true);
  });

  it("POST: should create a coin-network relation", async () => {
    const body = JSON.stringify({ coinId, networkId });
    const req = new Request("http://localhost/api/coin-network", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data?.message).toBe("Relation created");
    relationId = data.relation.id;
  });

  it("PUT: should toggle isActive status", async () => {
    const body = JSON.stringify({ isActive: false });
    const req = new Request("http://localhost/api/coin-network/" + relationId, {
      method: "PUT",
      body,
      headers: { "Content-Type": "application/json" },
    });

    const res = await PUT(req, { params: { id: relationId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.relation.isActive).toBe(false);
  });

  it("DELETE: should remove the coin-network relation", async () => {
    const req = new Request("http://localhost/api/coin-network/" + relationId, {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: { id: relationId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Relation deleted");
  });
});