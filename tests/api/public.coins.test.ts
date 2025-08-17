/**
 * @jest-environment node
 */
import { GET as GET_PublicCoins } from "@/app/api/public/coins/route";

const service = {
  listActive: jest.fn(),
};

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ coin: { service } }),
}));

async function parse(res: Response) {
  const txt = await res.text();
  return { status: res.status, json: txt ? JSON.parse(txt) : {} };
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/public/coins", () => {
  it("mengembalikan hanya coin aktif", async () => {
    service.listActive.mockResolvedValueOnce([
      { id: "1", symbol: "BTC", name: "Bitcoin", isActive: true },
      { id: "2", symbol: "ETH", name: "Ethereum", isActive: true },
    ]);

    const res = await GET_PublicCoins();
    const out = await parse(res);

    expect(out.status).toBe(200);
    expect(Array.isArray(out.json)).toBe(true);
    expect(out.json.every((c: any) => c.isActive !== false)).toBe(true);
    expect(service.listActive).toHaveBeenCalled();
  });
});
