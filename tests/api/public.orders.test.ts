/**
 * @jest-environment node
 */
import { POST as POST_NewOrder } from "@/app/api/public/orders/route";
import { GET as GET_Order, PATCH as PATCH_Cancel } from "@/app/api/public/orders/[id]/route";

const service = { create: jest.fn(), getById: jest.fn(), cancel: jest.fn() };

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ order: { service } }),
}));

function req(method: string, body?: any) {
  return new Request("http://localhost", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
async function parse(res: Response) {
  const t = await res.text();
  try { return { status: res.status, json: t ? JSON.parse(t) : {} }; } catch { return { status: res.status, json: {} }; }
}

beforeEach(() => jest.clearAllMocks());

test("POST invalid 400", async () => {
  const out = await parse(await POST_NewOrder(req("POST", { amount: -1 })));
  expect(out.status).toBe(400);
});

test("POST valid 201", async () => {
  service.create.mockResolvedValueOnce({ id: "ord1" });
  const payload = {
    coinToBuyId: "11111111-1111-4111-8111-111111111111",
    buyNetworkId: "22222222-2222-4222-8222-222222222222",
    payWithId: "33333333-3333-4333-8333-333333333333",
    payNetworkId: "44444444-4444-4444-8444-444444444444",
    amount: 1.23,
    receivingAddr: "addr",
  };
  const out = await parse(await POST_NewOrder(req("POST", payload)));
  expect(out.status).toBe(201);
});

test("GET order 200 or 404", async () => {
  service.getById.mockResolvedValueOnce({ id: "ord1" });
  let out = await parse(await GET_Order(new Request("http://localhost"), { params: Promise.resolve({ id: "ord1" }) }));
  expect(out.status).toBe(200);

  service.getById.mockResolvedValueOnce(null);
  out = await parse(await GET_Order(new Request("http://localhost"), { params: Promise.resolve({ id: "na" }) }));
  expect(out.status).toBe(404);
});

test("PATCH cancel 200", async () => {
  service.cancel.mockResolvedValueOnce({ id: "ord1", status: "CANCELED" });
  const out = await parse(await PATCH_Cancel(req("PATCH", { reason: "user cancel" }), { params: Promise.resolve({ id: "ord1" }) }));
  expect(out.status).toBe(200);
});
