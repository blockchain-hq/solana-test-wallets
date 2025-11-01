import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  type Cluster,
} from "@solana/web3.js";
import { TestWallet } from "./test-wallet.js";
import type {
  CreateWalletConfig,
  Network,
  SerializedWalletCollection,
} from "./types.js";
import { TokenManager } from "./token-manager.js";
import fs from "fs";
import { VERSION } from "./config.js";

export class TestWallets {
  private wallets: TestWallet[] = [];
  private connection: Connection;
  private network: Network;
  private currentIndex: number = 0;
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
      label = "default",
      count = 1,
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
      const wallet = new TestWallet(
        keypair,
        connection,
        network,
        manager.tokenManager
      );
      manager.wallets.push(wallet);

      if (fundSOL && fundSOL > 0) {
        await manager.fundWalletWithSOL(wallet, fundSOL);
      }

      if (fundTokens && Object.keys(fundTokens).length > 0) {
        for (const [tokenSymbol, amount] of Object.entries(fundTokens)) {
          if (amount && amount > 0) {
            await manager.fundWalletWithTokens(wallet, tokenSymbol, amount);
          }
        }
      }
    }

    return manager;
  }

  static async loadFromFile(filename: string): Promise<TestWallets> {
    // check if file exists
    if (!fs.existsSync(filename)) {
      throw new Error(`File ${filename} does not exist`);
    }

    const content = fs.readFileSync(filename, "utf8");
    const data: SerializedWalletCollection = JSON.parse(content);

    const rpcEndpoint =
      data.network === "localnet"
        ? "http://127.0.0.1:8899"
        : clusterApiUrl(data.network as Cluster);

    const connection = new Connection(rpcEndpoint, "confirmed");
    const manager = new TestWallets(connection, data.network);

    for (const serializedWallet of data.wallets) {
      const keypair = Keypair.fromSecretKey(
        Uint8Array.from(serializedWallet.secretKey)
      );

      const wallet = new TestWallet(
        keypair,
        connection,
        data.network,
        manager.tokenManager
      );
      manager.wallets.push(wallet);
    }

    if (data.mints && Object.keys(data.mints).length > 0) {
      manager.tokenManager.updateMints(data.mints);
    }

    return manager;
  }

  static async loadWalletFromFile(
    filename: string,
    network: Network
  ): Promise<TestWallets> {
    const content = fs.readFileSync(filename, "utf8");
    const secretKey = Uint8Array.from(JSON.parse(content));
    const keypair = Keypair.fromSecretKey(secretKey);

    const rpcEndpoint =
      network === "localnet"
        ? "http://127.0.0.1:8899"
        : clusterApiUrl(network as Cluster);
    const connection = new Connection(rpcEndpoint, "confirmed");
    const manager = new TestWallets(connection, network);

    const wallet = new TestWallet(
      keypair,
      connection,
      network,
      manager.tokenManager
    );
    manager.wallets.push(wallet);
    return manager;
  }

  static async loadWalletFromFiles(
    filenames: string[],
    network: Network
  ): Promise<TestWallets> {
    if (filenames.length === 0) {
      throw new Error("No filenames provided");
    }
    const manager = await TestWallets.loadWalletFromFile(
      filenames[0]!,
      network
    );
    for (const filename of filenames.slice(1)) {
      const wallet = await TestWallets.loadWalletFromFile(filename, network);
      manager.wallets.push(...wallet.wallets);
    }
    return manager;
  }

  async saveToFile(filename: string): Promise<void> {
    const data: SerializedWalletCollection = {
      version: VERSION,
      network: this.network,
      wallets: this.wallets.map((wallet) => wallet.toJSON()),
      mints: this.tokenManager.getMints(),
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  }

  async saveWalletToFile(filename: string, index: number): Promise<void> {
    const wallet = this.wallets[index];
    if (!wallet) {
      throw new Error(`Wallet at index ${index} not found`);
    }

    const secretKey = Array.from(wallet.keypair.secretKey);
    fs.writeFileSync(filename, JSON.stringify(secretKey, null, 2));
  }

  static async createOne(config: CreateWalletConfig = {}): Promise<TestWallet> {
    const manager = await TestWallets.create({
      ...config,
      count: 1,
    });
    if (manager.wallets.length === 0) {
      throw new Error("No wallets created");
    }
    return manager.wallets[0]!;
  }

  next(): TestWallet {
    const wallet = this.wallets[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.wallets.length;
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
    this.wallets = [];
    this.currentIndex = 0;
  }

  count(): number {
    return this.wallets.length;
  }

  async list(): Promise<void> {
    for (const wallet of this.wallets) {
      console.log(`${wallet.publicKey.toBase58()}`);
      console.log(`  Balance: ${await wallet.getBalance()} SOL`);
      console.log(`  Tokens: ${await wallet.getTokenBalance("USDC")} USDC`);
    }
  }

  async getAllBalances(): Promise<void> {
    for (const wallet of this.wallets) {
      const balance = await wallet.getBalance();
      const usdcBalance = await wallet.getTokenBalance("USDC");
      console.log(
        `${wallet.publicKey.toBase58()}: ${balance} SOL, ${usdcBalance} USDC`
      );
    }
  }

  getAll(): TestWallet[] {
    return this.wallets;
  }
}
