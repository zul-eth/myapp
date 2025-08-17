/**
 * @jest-environment node
 */
import { GET as GET_List } from "@/app/api/admin/orders/route";
import { GET as GET_One } from "@/app/api/admin/orders/[id]/route";
import { PATCH as PATCH_Status } from "@/app/api/admin/orders/[id]/status/route";

const service = { listAll: jest.fn(), getById: jest.fn(), updateStatus: jest.fn() };

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ order: { service } }),
}));

async function parse(res: Response) {
  const t = await res.text();
  try { return { status: res.status, json: t ? JSON.parse(t) : {} }; } catch { return { status: res.status, json: {} }; }
}

beforeEach(() => jest.clearAllMocks());

test("GET list 200", async () => {
  service.listAll.mockResolvedValueOnce([]);
  const out = await parse(await GET_List());
  expect(out.status).toBe(200);
});

test("GET one 404", async () => {
  service.getById.mockResolvedValueOnce(null);
  const out = await parse(await GET_One(new Request("http://localhost"), { params: Promise.resolve({ id: "na" }) }));
  expect(out.status).toBe(404);
});

test("PATCH status 200", async () => {
  service.updateStatus.mockResolvedValueOnce({ id: "o1", status: "COMPLETED" });
  const req = new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) });
  const out = await parse(await PATCH_Status(req, { params: Promise.resolve({ id: "o1" }) }));
  expect(out.status).toBe(200);
});
