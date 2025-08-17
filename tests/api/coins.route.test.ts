/**
 * @jest-environment node
 */
import { POST as POST_Coins } from "@/app/api/admin/coins/route";
import { PUT as PUT_Coin, DELETE as DELETE_Coin } from "@/app/api/admin/coins/[id]/route";
import { PATCH as PATCH_Active } from "@/app/api/admin/coins/[id]/active/route";

// Mock core & service
const service = {
  listAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteHard: jest.fn(),
  toggleActive: jest.fn(),
};

jest.mock("@/core", () => ({
  getApplicationManager: () => ({ coin: { service } }),
}));

function req(method: string, body?: unknown) {
  return new Request("http://localhost", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function parse(res: Response) {
  const text = await res.text();
  try {
    return { status: res.status, json: text ? JSON.parse(text) : {} };
  } catch {
    return { status: res.status, json: {} };
  }
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/admin/coins", () => {
  it("400 jika payload tidak valid", async () => {
    const res = await POST_Coins(req("POST", { symbol: "x", name: "" }));
    const out = await parse(res);
    expect(out.status).toBe(400);
    expect(out.json.error).toBeDefined();
  });

  it("201 jika payload valid", async () => {
    service.create.mockResolvedValueOnce({ id: "1", symbol: "BTC", name: "Bitcoin", isActive: true });
    const res = await POST_Coins(req("POST", { symbol: "btc", name: "Bitcoin" }));
    const out = await parse(res);
    expect(service.create).toHaveBeenCalledWith({ symbol: "BTC", name: "Bitcoin" });
    expect(out.status).toBe(201);
    expect(out.json.symbol).toBe("BTC");
  });

  it("409 jika symbol sudah ada", async () => {
    service.create.mockRejectedValueOnce(new Error("Coin dengan symbol BTC sudah ada"));
    const res = await POST_Coins(req("POST", { symbol: "btc", name: "Bitcoin" }));
    const out = await parse(res);
    expect(out.status).toBe(409);
  });
});

describe("PUT /api/admin/coins/[id]", () => {
  it("400 jika update invalid", async () => {
    const res = await PUT_Coin(req("PUT", { symbol: "?" }), { params: Promise.resolve({ id: "1" }) });
    const out = await parse(res);
    expect(out.status).toBe(400);
  });

  it("200 jika update valid", async () => {
    service.update.mockResolvedValueOnce({ id: "1", symbol: "BTC", name: "Bitcoin 2" });
    const res = await PUT_Coin(req("PUT", { name: "Bitcoin 2" }), { params: Promise.resolve({ id: "1" }) });
    const out = await parse(res);
    expect(out.status).toBe(200);
    expect(service.update).toHaveBeenCalledWith("1", { name: "Bitcoin 2" });
  });

  it("404 jika coin tidak ditemukan", async () => {
    service.update.mockRejectedValueOnce(new Error("Coin tidak ditemukan"));
    // Gunakan payload VALID agar lolos Zod dan mencapai service.update
    const res = await PUT_Coin(req("PUT", { name: "Ok" }), { params: Promise.resolve({ id: "NA" }) });
    const out = await parse(res);
    expect(out.status).toBe(404);
  });
});

describe("PATCH /api/admin/coins/[id]/active", () => {
  it("400 jika isActive bukan boolean", async () => {
    const res = await PATCH_Active(req("PATCH", { isActive: "nope" } as any), {
      params: Promise.resolve({ id: "1" }),
    });
    const out = await parse(res);
    expect(out.status).toBe(400);
  });

  it("200 jika valid", async () => {
    service.toggleActive.mockResolvedValueOnce({ id: "1", isActive: false });
    const res = await PATCH_Active(req("PATCH", { isActive: false }), { params: Promise.resolve({ id: "1" }) });
    const out = await parse(res);
    expect(out.status).toBe(200);
    expect(service.toggleActive).toHaveBeenCalledWith("1", false);
  });
});

describe("DELETE /api/admin/coins/[id]", () => {
  it("200 saat berhasil hapus (cascade)", async () => {
    service.deleteHard.mockResolvedValueOnce({ success: true });
    const res = await DELETE_Coin(req("DELETE"), { params: Promise.resolve({ id: "1" }) });
    const out = await parse(res);
    expect(out.status).toBe(200);
    expect(out.json.success).toBe(true);
  });
});
