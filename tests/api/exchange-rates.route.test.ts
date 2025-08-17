/**
 * @jest-environment node
 */
import { GET as GET_Rates, POST as POST_Rates } from "@/app/api/admin/exchange-rates/route";
import { PUT as PUT_Rate, DELETE as DELETE_Rate } from "@/app/api/admin/exchange-rates/[id]/route";

const service = {
  listAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ exchangeRate: { service } }),
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
  const out = await parse(await GET_Rates());
  expect(out.status).toBe(200);
});

test("POST invalid 400", async () => {
  const out = await parse(await POST_Rates(req("POST", { rate: -1 })));
  expect(out.status).toBe(400);
});

test("POST valid 201", async () => {
  service.create.mockResolvedValueOnce({ id: "1" });
  const payload = {
    buyCoinId: "8bcf1a62-1111-4e3e-8c06-aaaaaaaabbbb",
    buyNetworkId: "8bcf1a62-2222-4e3e-8c06-ccccccccdddd",
    payCoinId: "8bcf1a62-3333-4e3e-8c06-eeeeeeeeffff",
    payNetworkId: "8bcf1a62-4444-4e3e-8c06-aaaaaaaacccc",
    rate: 1.2345,
  };
  const out = await parse(await POST_Rates(req("POST", payload)));
  expect(out.status).toBe(201);
});

test("PUT valid 200", async () => {
  service.update.mockResolvedValueOnce({ id: "1", rate: 2.0 });
  const out = await parse(await PUT_Rate(req("PUT", { rate: 2 }), { params: Promise.resolve({ id: "1" }) }));
  expect(out.status).toBe(200);
});

test("DELETE 200", async () => {
  service.delete.mockResolvedValueOnce({ id: "1" });
  const out = await parse(await DELETE_Rate(req("DELETE"), { params: Promise.resolve({ id: "1" }) }));
  expect(out.status).toBe(200);
});
