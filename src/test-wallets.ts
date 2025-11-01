import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  type Cluster,
} from "@solana/web3.js";
import { TestWallet } from "./test-wallet.js";
import type { CreateWalletConfig, Network, WalletConfig } from "./types.js";
import { TokenManager } from "./token-manager.js";

export class TestWallets {
  private wallets: Map<string, TestWallet> = new Map();
  private connection: Connection;
  private network: Network;
  private currentLabelIndex: number = 0;
  private tokenManager: TokenManager;

  private constructor(connection: Connection, network: Network) {
    this.connection = connection;
    this.network = network;
    this.tokenManager = new TokenManager(connection, network);
  }

  static async create(config: CreateWalletConfig = {}): Promise<TestWallets> {
    const {
      network = "localnet",
      endpoint,
      wallets = new Map<string, WalletConfig>(),
    } = config;

    let rpcEndpoint: string;
    if (endpoint) {
      rpcEndpoint = endpoint;
    } else if (network === "localnet") {
      rpcEndpoint = "http://127.0.0.1:8899";
    } else {
      rpcEndpoint = clusterApiUrl(network as Cluster);
    }
    const connection = new Connection(rpcEndpoint, "confirmed");

    const manager = new TestWallets(connection, network);

    for (const [label, walletConfig] of wallets.entries()) {
      const keypair = Keypair.generate();
      const wallet = new TestWallet(
        label,
        keypair,
        connection,
        network,
        manager.tokenManager
      );
      manager.wallets.set(label, wallet);

      if (walletConfig.fundSOL) {
        await manager.fundWalletWithSOL(wallet, walletConfig.fundSOL);
      }

      if (walletConfig.fundTokens) {
        for (const [tokenSymbol, amount] of Object.entries(
          walletConfig.fundTokens
        )) {
          await manager.fundWalletWithTokens(wallet, tokenSymbol, amount);
        }
      }
    }

    return manager;
  }

  static async createOne(config: CreateWalletConfig = {}): Promise<TestWallet> {
    const manager = await TestWallets.create({
      ...config,
      wallets: new Map([["default", {}]]),
    });
    return manager.wallets.get("default")!;
  }

  get(label: string): TestWallet {
    const wallet = this.wallets.get(label);
    if (!wallet) {
      throw new Error(`Wallet ${label} not found`);
    }
    return wallet;
  }

  next(): TestWallet {
    const wallet = Array.from(this.wallets.values())[this.currentLabelIndex];
    this.currentLabelIndex = (this.currentLabelIndex + 1) % this.wallets.size;
    if (!wallet) {
      throw new Error("No more wallets available");
    }
    return wallet;
  }

  private async fundWalletWithSOL(
    wallet: TestWallet,
    amount: number
  ): Promise<void> {
    const sig = await this.connection.requestAirdrop(
      wallet.publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await this.connection.confirmTransaction(sig, "confirmed");
  }

  async fundWalletWithTokens(
    wallet: TestWallet,
    tokenSymbol: string,
    amount: number
  ): Promise<void> {
    await this.tokenManager.fundWalletWithTokens(wallet, tokenSymbol, amount);
  }

  async dispose(): Promise<void> {
    this.wallets.clear();
    this.currentLabelIndex = 0;
  }

  count(): number {
    return this.wallets.size;
  }

  list(): void {
    Array.from(this.wallets.values()).forEach((wallet) => {
      console.log(`${wallet.label} ${wallet.publicKey.toBase58()}`);
      console.log(`  Balance: ${wallet.getBalance()} SOL`);
      console.log(`  Tokens: ${wallet.getTokenBalance("USDC")} USDC`);
    });
  }

  getAll(): TestWallet[] {
    return Array.from(this.wallets.values());
  }

  getByLabel(label: string): TestWallet {
    const wallet = this.wallets.get(label);
    if (!wallet) {
      throw new Error(`Wallet ${label} not found`);
    }
    return wallet;
  }
}
