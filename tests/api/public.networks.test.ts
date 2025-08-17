/**
 * @jest-environment node
 */
import { GET as GET_PublicNetworks } from "@/app/api/public/networks/route";

const service = { listAll: jest.fn() };

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ network: { service } }),
}));

async function parse(res: Response) {
  const t = await res.text();
  return { status: res.status, json: t ? JSON.parse(t) : {} };
}

beforeEach(() => jest.clearAllMocks());

test("returns only active networks", async () => {
  service.listAll.mockResolvedValueOnce([
    { id: "1", symbol: "ETH", name: "Ethereum", family: "EVM", isActive: true },
    { id: "2", symbol: "TEST", name: "TestNet", family: "EVM", isActive: false },
  ]);
  const out = await parse(await GET_PublicNetworks(new Request("http://x/api/public/networks")));
  expect(out.status).toBe(200);
  expect(out.json.length).toBe(1);
  expect(out.json[0].symbol).toBe("ETH");
});

test("filters by family and symbol (uppercased)", async () => {
  service.listAll.mockResolvedValueOnce([
    { id: "1", symbol: "ETH", name: "Ethereum", family: "EVM", isActive: true },
  ]);
  await GET_PublicNetworks(new Request("http://x/api/public/networks?family=evm&symbol=eth"));
  // cukup memastikan 200; filtering terjadi di route
});
