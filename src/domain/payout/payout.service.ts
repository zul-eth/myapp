import { prisma } from "@/lib/prisma";
import { ENV } from "@/config/env";
import { AssetType, ChainFamily, OrderStatus } from "@prisma/client";
import { sendErc20, sendNative } from "@/lib/payout/evm";
import { OrderRepositoryPrisma } from "@/domain/order/order.repository";

export class PayoutService {
  private readonly orderRepo = new OrderRepositoryPrisma();

  /**
   * Jalankan payout untuk sebuah order:
   * - Valid jika status COMPLETED dan payoutHash belum ada.
   * - Saat ini dukung EVM (ETH/Base/Arbitrum Sepolia), native & ERC-20.
   */
  async payoutOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { coinToBuy: true, buyNetwork: true },
    });
    if (!order) throw new Error("Order tidak ditemukan");
    if (order.status !== OrderStatus.COMPLETED) {
      throw new Error(`Order belum COMPLETED (status: ${order.status})`);
    }
    if (!order.receivingAddr) {
      throw new Error("Order tidak memiliki receivingAddr");
    }
    if (order.payoutHash) {
      return { alreadyPaid: true, txHash: order.payoutHash };
    }

    const cn = await prisma.coinNetwork.findFirst({
      where: { coinId: order.coinToBuyId, networkId: order.buyNetworkId, isActive: true },
      include: { network: true, coin: true },
    });
    if (!cn) throw new Error("CoinNetwork (coinToBuy x buyNetwork) tidak ditemukan/aktif");

    if (cn.network.family !== ChainFamily.EVM) {
      throw new Error(`Family ${cn.network.family} belum didukung payout`);
    }

    const netNameUpper = (cn.network.name || "").toUpperCase();
    const { rpcUrl, privateKey } = this.resolveEvmEnv(netNameUpper);
    const amountHuman = String(order.amount);

    let txHash: string;
    if (cn.assetType === AssetType.NATIVE) {
      txHash = await sendNative({
        rpcUrl,
        privateKey,
        to: order.receivingAddr,
        amountHuman,
      });
    } else if (cn.assetType === AssetType.EVM_ERC20) {
      if (!cn.contractAddress) throw new Error("contractAddress ERC-20 tidak tersedia pada CoinNetwork");
      const decimals = typeof cn.decimals === "number" ? cn.decimals : 18;
      txHash = await sendErc20({
        rpcUrl,
        privateKey,
        token: cn.contractAddress,
        to: order.receivingAddr,
        amountHuman,
        decimals,
      });
    } else {
      throw new Error(`AssetType ${cn.assetType} belum didukung payout`);
    }

    await this.orderRepo.setPayout(order.id, txHash);
    return { alreadyPaid: false, txHash };
  }

  /** Mapping ENV untuk signer EVM. Tambah case bila perlu. */
    private resolveEvmEnv(networkNameUpper: string): { rpcUrl: string; privateKey: string } {
    // normalisasi: spasi → underscore, uppercase
    const key = networkNameUpper.replace(/\s+/g, "_");
    switch (key) {
      case "ETH_SEPOLIA": {
        const rpcUrl = ENV.RPC_ETH_SEPOLIA;
        const privateKey = ENV.ETH_SEPOLIA_PRIVATE_KEY;
        if (!rpcUrl) throw new Error("RPC_ETH_SEPOLIA kosong");
        if (!privateKey) throw new Error("ETH_SEPOLIA_PRIVATE_KEY kosong");
        return { rpcUrl, privateKey };
      }
      case "BASE_SEPOLIA": {
        const rpcUrl = ENV.RPC_BASE_SEPOLIA;
        const privateKey = ENV.BASE_SEPOLIA_PRIVATE_KEY as string | undefined;
        if (!rpcUrl) throw new Error("RPC_BASE_SEPOLIA kosong");
        if (!privateKey) throw new Error("BASE_SEPOLIA_PRIVATE_KEY kosong");
        return { rpcUrl, privateKey };
      }
      case "ARB_SEPOLIA": {
        const rpcUrl = ENV.RPC_ARB_SEPOLIA;
        const privateKey = ENV.ARB_SEPOLIA_PRIVATE_KEY as string | undefined;
        if (!rpcUrl) throw new Error("RPC_ARB_SEPOLIA kosong");
        if (!privateKey) throw new Error("ARB_SEPOLIA_PRIVATE_KEY kosong");
        return { rpcUrl, privateKey };
      }
      default:
        throw new Error(
          `EVM payout belum dikonfigurasi untuk network '${key}'. Tambahkan mapping ENV jika perlu.`
        );
    }
  }

}
