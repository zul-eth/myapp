import { CoinRepositoryPrisma } from "@/domain/coin/coin.repository";
import { CoinService } from "@/domain/coin/coin.service";
import { CoinController } from "@/domain/coin/coin.controller";

import { NetworkRepositoryPrisma } from "@/domain/network/network.repository";
import { NetworkService } from "@/domain/network/network.service";
import { NetworkController } from "@/domain/network/network.controller";

import { CoinNetworkRepositoryPrisma } from "@/domain/coin-network/coin-network.repository";
import { CoinNetworkService } from "@/domain/coin-network/coin-network.service";
import { CoinNetworkController } from "@/domain/coin-network/coin-network.controller";

import { PaymentOptionRepositoryPrisma } from "@/domain/payment-option/payment-option.repository";
import { PaymentOptionService } from "@/domain/payment-option/payment-option.service";
import { PaymentOptionController } from "@/domain/payment-option/payment-option.controller";

import { WalletRepositoryPrisma } from "@/domain/wallet/wallet.repository";
import { WalletService } from "@/domain/wallet/wallet.service";

import { ExchangeRateRepositoryPrisma } from "@/domain/exchange-rate/exchange-rate.repository";
import { ExchangeRateService } from "@/domain/exchange-rate/exchange-rate.service";
import { ExchangeRateController } from "@/domain/exchange-rate/exchange-rate.controller";

import { OrderRepositoryPrisma } from "@/domain/order/order.repository";
import { OrderService } from "@/domain/order/order.service";
import { OrderController } from "@/domain/order/order.controller";

import { PayoutService } from "@/domain/payout/payout.service";
import { PayoutController } from "@/domain/payout/payout.controller";


export class ApplicationManager {
  coin: any;
  network: any;
  coinNetwork: any;
  paymentOption: any;
  wallet: any;
  exchangeRate: any;
  order: any;
  payout!: { service: PayoutService; controller: PayoutController };

  constructor() {
    const coinRepo = new CoinRepositoryPrisma();
    const coinService = new CoinService(coinRepo);
    const coinController = new CoinController(coinService);
    this.coin = { repository: coinRepo, service: coinService, controller: coinController };

    const networkRepo = new NetworkRepositoryPrisma();
    const networkService = new NetworkService(networkRepo);
    const networkController = new NetworkController(networkService);
    this.network = { repository: networkRepo, service: networkService, controller: networkController };

    const cnRepo = new CoinNetworkRepositoryPrisma();
    const cnService = new CoinNetworkService(cnRepo);
    const cnController = new CoinNetworkController(cnService);
    this.coinNetwork = { repository: cnRepo, service: cnService, controller: cnController };

    const poRepo = new PaymentOptionRepositoryPrisma();
    const poService = new PaymentOptionService(poRepo);
    const poController = new PaymentOptionController(poService);
    this.paymentOption = { repository: poRepo, service: poService, controller: poController };

    const walletRepo = new WalletRepositoryPrisma();
    const walletService = new WalletService(walletRepo);
    this.wallet = { repository: walletRepo, service: walletService };

    const rateRepo = new ExchangeRateRepositoryPrisma();
    const rateService = new ExchangeRateService(rateRepo);
    const rateController = new ExchangeRateController(rateService);
    this.exchangeRate = { repository: rateRepo, service: rateService, controller: rateController };

    const orderRepo = new OrderRepositoryPrisma();
    const orderService = new OrderService(orderRepo, rateService, walletService);
    const orderController = new OrderController(orderService);
    this.order = { repository: orderRepo, service: orderService, controller: orderController };
    
    const payoutService = new PayoutService();
    const payoutController = new PayoutController(payoutService);
    this.payout = { service: payoutService, controller: payoutController };
  }
}
