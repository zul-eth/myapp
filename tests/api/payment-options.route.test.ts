/**
 * @jest-environment node
 */
import { GET as GET_PublicPO } from "@/app/api/public/payment-options/route";

const service = { listActive: jest.fn() };

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ paymentOption: { service } }),
}));

async function parse(res: Response) {
  const txt = await res.text();
  return { status: res.status, json: txt ? JSON.parse(txt) : {} };
}

beforeEach(() => jest.clearAllMocks());

test("GET /api/public/payment-options returns active items", async () => {
  service.listActive.mockResolvedValueOnce([
    {
      id: "1",
      isActive: true,
      coin: { id: "c1", symbol: "USDT", name: "Tether USD" },
      network: { id: "n1", symbol: "ETH", name: "Ethereum" },
    },
  ]);

  const res = await GET_PublicPO(new Request("http://localhost/api/public/payment-options"));
  const out = await parse(res);

  expect(out.status).toBe(200);
  expect(Array.isArray(out.json)).toBe(true);
  expect(service.listActive).toHaveBeenCalledWith({
    coinId: undefined,
    networkId: undefined,
    coinSymbol: undefined,
    networkSymbol: undefined,
  });
});

test("GET with filters uppercases symbols", async () => {
  service.listActive.mockResolvedValueOnce([]);
  const res = await GET_PublicPO(
    new Request("http://localhost/api/public/payment-options?coinSymbol=usdt&networkSymbol=eth")
  );
  await parse(res);
  expect(service.listActive).toHaveBeenCalledWith({
    coinId: undefined,
    networkId: undefined,
    coinSymbol: "USDT",
    networkSymbol: "ETH",
  });
});
