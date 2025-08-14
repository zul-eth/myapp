import { NextRequest } from "next/server";
import { CoinService } from "./coin.service";

const ok = (d: any) => new Response(JSON.stringify(d), { status: 200 });
const problem = (e: any) => new Response(JSON.stringify({ error: e.message }), { status: 500 });

export class CoinController {
  constructor(private readonly service: CoinService) {}
  list = async () => {
    try {
      return ok(await this.service.list());
    } catch (e) {
      return problem(e);
    }
  };
}
