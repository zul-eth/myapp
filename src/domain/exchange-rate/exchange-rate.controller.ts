import { NextRequest } from "next/server";
import { ExchangeRateService } from "./exchange-rate.service";

const ok = (data: any) => new Response(JSON.stringify(data), { status: 200 });
const badRequest = (message: string) => new Response(JSON.stringify({ error: message }), { status: 400 });
const problem = (e: any) => new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500 });

export class ExchangeRateController {
  constructor(private readonly service: ExchangeRateService) {}

  getLatest = async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const buyCoinId = searchParams.get("buyCoinId");
      const buyNetworkId = searchParams.get("buyNetworkId");
      const payCoinId = searchParams.get("payCoinId");
      const payNetworkId = searchParams.get("payNetworkId");

      if (!buyCoinId || !buyNetworkId || !payCoinId || !payNetworkId) {
        return badRequest("Missing required parameters");
      }

      const rate = await this.service.getLatest({ buyCoinId, buyNetworkId, payCoinId, payNetworkId });
      if (!rate) {
        return badRequest("Rate not found");
      }

      return ok(rate);
    } catch (e) {
      return problem(e);
    }
  };
}
