/**
 * @jest-environment node
 */
import { POST as POST_Networks, GET as GET_Networks } from "@/app/api/admin/networks/route";
import { PUT as PUT_Network, DELETE as DELETE_Network } from "@/app/api/admin/networks/[id]/route";
import { PATCH as PATCH_Active } from "@/app/api/admin/networks/[id]/active/route";

const service = {
  listAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteHard: jest.fn(),
  toggleActive: jest.fn(),
};

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ network: { service } }),
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

test("GET networks ok", async () => {
  service.listAll.mockResolvedValueOnce([]);
  const out = await parse(await GET_Networks());
  expect(out.status).toBe(200);
  expect(Array.isArray(out.json)).toBe(true);
});

test("POST invalid returns 400", async () => {
  const out = await parse(await POST_Networks(req("POST", { symbol: "x", name: "" })));
  expect(out.status).toBe(400);
});

test("POST valid returns 201", async () => {
  service.create.mockResolvedValueOnce({ id: "1" });
  const out = await parse(await POST_Networks(req("POST", { symbol: "eth", name: "Ethereum", family: "EVM" })));
  expect(service.create).toHaveBeenCalledWith({ symbol: "ETH", name: "Ethereum", family: "EVM" });
  expect(out.status).toBe(201);
});

test("PUT update invalid 400", async () => {
  const out = await parse(await PUT_Network(req("PUT", { symbol: "?" }), { params: Promise.resolve({ id: "1" }) }));
  expect(out.status).toBe(400);
});

test("PATCH active 200", async () => {
  service.toggleActive.mockResolvedValueOnce({ id: "1", isActive: false });
  const out = await parse(await PATCH_Active(req("PATCH", { isActive: false }), { params: Promise.resolve({ id: "1" }) }));
  expect(out.status).toBe(200);
});

test("DELETE 200", async () => {
  service.deleteHard.mockResolvedValueOnce({ success: true });
  const out = await parse(await DELETE_Network(req("DELETE"), { params: Promise.resolve({ id: "1" }) }));
  expect(out.status).toBe(200);
});
