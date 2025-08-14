import { PaymentOptionService } from "./payment-option.service";

const ok = (d: any) => new Response(JSON.stringify(d), { status: 200 });
const problem = (e: any) => new Response(JSON.stringify({ error: e.message }), { status: 500 });

export class PaymentOptionController {
  constructor(private readonly service: PaymentOptionService) {}
  list = async () => {
    try {
      return ok(await this.service.list());
    } catch (e) {
      return problem(e);
    }
  };
}
