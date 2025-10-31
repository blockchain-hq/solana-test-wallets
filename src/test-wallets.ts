import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  type Cluster,
} from "@solana/web3.js";
import { TestWallet } from "./test-wallet.js";
import type { CreateWalletConfig, Network } from "./types.js";

export class TestWallets {
  private wallets: TestWallet[] = [];
  private connection: Connection;
  private network: Network;
  private currentIndex: number = 0;

  private constructor(connection: Connection, network: Network) {
    this.connection = connection;
    this.network = network;
  }

  static async create(config: CreateWalletConfig = {}): Promise<TestWallets> {
    const {
      count = 1,
      network = "localnet",
      endpoint,
      fundSOL = 0,
      fundTokens = {},
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

    for (let i = 0; i < count; i++) {
      const keypair = Keypair.generate();
      const wallet = new TestWallet(keypair, connection, network);
      manager.wallets.push(wallet);

      if (fundSOL > 0) {
        await manager.fundWalletWithSOL(wallet, fundSOL);
      }

      // TODO: fund with tokens
    }

    return manager;
  }

  static async createOne(config: CreateWalletConfig = {}): Promise<TestWallet> {
    const manager = await TestWallets.create({ ...config, count: 1 });
    return manager.get(0);
  }
  get(index: number): TestWallet {
    if (index < 0 || index >= this.wallets.length) {
      throw new Error(`Wallet index ${index} out of bounds`);
    }
    if (!this.wallets[index]) {
      throw new Error(`Wallet index ${index} not found`);
    }
    return this.wallets[index];
  }

  next(): TestWallet {
    const wallet = this.wallets[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.wallets.length;
    if (!wallet) {
      throw new Error("No more wallets available");
    }
    return wallet;
  }

  random(): TestWallet {
    const randomIndex = Math.floor(Math.random() * this.wallets.length);
    const wallet = this.wallets[randomIndex];
    if (!wallet) {
      throw new Error("No more wallets available");
    }
    return wallet;
  }

  all(): TestWallet[] {
    return this.wallets;
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

  async dispose(): Promise<void> {
    this.wallets = [];
    this.currentIndex = 0;
  }
}
