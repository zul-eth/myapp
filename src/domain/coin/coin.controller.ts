import { NextRequest } from "next/server";
import { CoinService } from "./coin.service";
import { CoinRepositoryPrisma } from "./coin.repository";

const ok = (d: any, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json" } });
const problem = (e: any, status = 400) =>
  new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export class CoinController {
  private service: CoinService;
  constructor() {
    this.service = new CoinService(new CoinRepositoryPrisma());
  }

  list = async () => {
    try {
      return ok(await this.service.listAll());
    } catch (e) {
      return problem(e, 500);
    }
  };

  create = async (req: NextRequest) => {
    try {
      const body = await req.json();
      const created = await this.service.create({
        symbol: body.symbol,
        name: body.name,
        logoUrl: body.logoUrl ?? null,
      });
      return ok(created, 201);
    } catch (e) {
      return problem(e);
    }
  };

  update = async (req: NextRequest, id: string) => {
    try {
      const body = await req.json();
      const updated = await this.service.update(id, body);
      return ok(updated, 200);
    } catch (e) {
      return problem(e);
    }
  };

  toggleActive = async (req: NextRequest, id: string) => {
    try {
      const { isActive } = await req.json();
      const updated = await this.service.toggleActive(id, !!isActive);
      return ok(updated, 200);
    } catch (e) {
      return problem(e);
    }
  };

  delete = async (_req: NextRequest, id: string) => {
    try {
      const res = await this.service.deleteHard(id);
      return ok(res, 200);
    } catch (e) {
      return problem(e);
    }
  };
}
