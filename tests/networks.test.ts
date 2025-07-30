import { PrismaClient } from "@prisma/client";
import { GET as getHandler, POST as postHandler } from "@/app/api/networks/route";
import { PUT as putHandler, DELETE as deleteHandler } from "@/app/api/networks/[id]/route";

const prisma = new PrismaClient();

describe("API /api/networks", () => {
  let createdId: string;

  it("GET: should return list of active networks with coins", async () => {
    const req = new Request("http://localhost/api/networks", {
      method: "GET",
    });

    const res = await getHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("POST: should create or update a network", async () => {
    const req = new Request("http://localhost/api/networks", {
      method: "POST",
      body: JSON.stringify({ name: "MockNetwork", logoUrl: "https://example.com/logo.png" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await postHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.network.name).toBe("MockNetwork");

    createdId = data.network.id;
  });

  it("PUT: should update the network", async () => {
    const req = new Request(`http://localhost/api/networks/${createdId}`, {
      method: "PUT",
      body: JSON.stringify({ name: "UpdatedMockNet", isActive: false }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await putHandler(req, { params: { id: createdId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.network.name).toBe("UpdatedMockNet");
    expect(data.network.isActive).toBe(false);
  });

  it("DELETE: should delete the network", async () => {
    const req = new Request(`http://localhost/api/networks/${createdId}`, {
      method: "DELETE",
    });

    const res = await deleteHandler(req, { params: { id: createdId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/deleted/i);
  });
});