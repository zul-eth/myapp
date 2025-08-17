/**
 * @jest-environment node
 */
import { GET as GET_PublicRates } from "@/app/api/public/exchange-rates/route";

const service = { listAll: jest.fn() };

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ exchangeRate: { service } }),
}));

async function parse(res: Response) {
  const t = await res.text();
  return { status: res.status, json: t ? JSON.parse(t) : {} };
}

beforeEach(() => jest.clearAllMocks());

test("returns filtered by symbols", async () => {
  service.listAll.mockResolvedValueOnce([
    {
      id: "r1",
      rate: 3500,
      updatedAt: new Date().toISOString(),
      buyCoin: { id: "cETH", symbol: "ETH" },
      buyNetwork: { id: "nETH", symbol: "ETH" },
      payCoin: { id: "cUSDT", symbol: "USDT" },
      payNetwork: { id: "nETH", symbol: "ETH" },
    },
    {
      id: "r2",
      rate: 150,
      updatedAt: new Date().toISOString(),
      buyCoin: { id: "cSOL", symbol: "SOL" },
      buyNetwork: { id: "nSOL", symbol: "SOL" },
      payCoin: { id: "cUSDT", symbol: "USDT" },
      payNetwork: { id: "nETH", symbol: "ETH" },
    },
  ]);

  const url = "http://x/api/public/exchange-rates?buyCoinSymbol=eth&payCoinSymbol=usdt";
  const out = await parse(await GET_PublicRates(new Request(url)));

  expect(out.status).toBe(200);
  expect(out.json.length).toBe(1);
  expect(out.json[0].buyCoin.symbol).toBe("ETH");
});
