/**
 * @jest-environment node
 */
import { GET as GET_CNs, POST as POST_CNs } from "@/app/api/admin/coin-networks/route";
import { PUT as PUT_CN, DELETE as DELETE_CN } from "@/app/api/admin/coin-networks/[id]/route";
import { PATCH as PATCH_CN_Active } from "@/app/api/admin/coin-networks/[id]/active/route";

const service = {
  listAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  toggleActive: jest.fn(),
};

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ coinNetwork: { service } }),
}));

function req(method: string, body?: any) {
  return new Request("http://localhost", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
async function parse(res: Response) {
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : {} };
}

beforeEach(() => jest.clearAllMocks());

test("GET 200", async () => {
  service.listAll.mockResolvedValueOnce([]);
  const out = await parse(await GET_CNs());
  expect(out.status).toBe(200);
});

test("POST invalid 400", async () => {
  const out = await parse(await POST_CNs(req("POST", { coinId: "not-uuid" })));
  expect(out.status).toBe(400);
});

test("POST valid 201", async () => {
  service.create.mockResolvedValueOnce({ id: "1" });
  const out = await parse(await POST_CNs(req("POST", { coinId: "8bcf1a62-1111-4e3e-8c06-aaaaaaaabbbb", networkId: "8bcf1a62-2222-4e3e-8c06-ccccccccdddd", assetType: "NATIVE", decimals: 18 })));
  expect(out.status).toBe(201);
});

test("PUT valid 200", async () => {
  service.update.mockResolvedValueOnce({ id: "1" });
  const out = await parse(await PUT_CN(req("PUT", { decimals: 6 }), { params: Promise.resolve({ id: "1" }) }));
  expect(out.status).toBe(200);
});

test("PATCH active 200", async () => {
  service.toggleActive.mockResolvedValueOnce({ id: "1", isActive: false });
  const out = await parse(await PATCH_CN_Active(req("PATCH", { isActive: false }), { params: Promise.resolve({ id: "1" }) }));
  expect(out.status).toBe(200);
});

test("DELETE 200", async () => {
  service.delete.mockResolvedValueOnce({ id: "1" });
  const out = await parse(await DELETE_CN(req("DELETE"), { params: Promise.resolve({ id: "1" }) }));
  expect(out.status).toBe(200);
});
