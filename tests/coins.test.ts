import { GET as getCoins, POST as postCoin } from "@/app/api/coins/route";
import {
  PUT as putCoin,
  DELETE as deleteCoin,
} from "@/app/api/coins/[id]/route";
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("API /api/coins", () => {
  let createdId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET: should return list of active coins with networks", async () => {
    const res = await getCoins();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("POST: should create or update a coin", async () => {
    const req = {
      json: async () => ({
        symbol: "TEST",
        name: "Test Coin",
        logoUrl: "https://example.com/logo.png",
      }),
    } as unknown as NextRequest;

    const res = await postCoin(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.coin.symbol).toBe("TEST");
    createdId = json.coin.id;
  });

  it("POST: should return 400 if required fields are missing", async () => {
    const req = {
      json: async () => ({
        name: "No Symbol Coin",
      }),
    } as unknown as NextRequest;

    const res = await postCoin(req);
    expect(res.status).toBe(400);
  });

  it("PUT: should update an existing coin", async () => {
    const req = {
      json: async () => ({
        name: "Updated Coin Name",
        logoUrl: "https://updated-logo.com",
        isActive: true,
      }),
    } as unknown as NextRequest;

    const res = await putCoin(req, { params: { id: createdId } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.coin.name).toBe("Updated Coin Name");
  });

  it("DELETE: should delete the coin", async () => {
    const res = await deleteCoin({} as Request, {
      params: { id: createdId },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe("Coin deleted");
  });
});