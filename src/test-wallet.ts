import {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  type Keypair,
} from "@solana/web3.js";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { Network } from "./types.js";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import type { TokenManager } from "./token-manager.js";
import type { SerializedWallet } from "./types.js";

export class TestWallet {
  public readonly keypair: Keypair;
  public readonly publicKey: PublicKey;
  private connection: Connection;
  private network: Network;
  private tokenManager: TokenManager;

  constructor(
    keypair: Keypair,
    connection: Connection,
    network: Network,
    tokenManager: TokenManager
  ) {
    this.keypair = keypair;
    this.publicKey = keypair.publicKey;
    this.network = network;
    this.connection = connection;
    this.tokenManager = tokenManager;
  }

  async getBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async getTokenBalance(
    tokenMintOrSymbol: string,
    decimals: number = 6
  ): Promise<number> {
    const mint = this.resolveMint(tokenMintOrSymbol);
    const ata = await getAssociatedTokenAddress(mint, this.publicKey);

    try {
      const account = await getAccount(this.connection, ata);
      return Number(account.amount) / Math.pow(10, decimals);
    } catch (error) {
      return 0;
    }
  }

  async createTokenAccount(tokenMintOrSymbol: string): Promise<PublicKey> {
    const mint = this.resolveMint(tokenMintOrSymbol);
    const ata = await getAssociatedTokenAddress(mint, this.publicKey);

    try {
      await getAccount(this.connection, ata);
      return ata;
    } catch (error) {
      // If the account doesn't exist, create it
    }

    const ix = createAssociatedTokenAccountInstruction(
      this.publicKey,
      ata,
      this.publicKey,
      mint
    );

    const tx = new Transaction().add(ix);
    await sendAndConfirmTransaction(this.connection, tx, [this.keypair]);
    return ata;
  }

  async hasTokenAccount(tokenMintOrSymbol: string): Promise<boolean> {
    const mint = this.resolveMint(tokenMintOrSymbol);
    const ata = await getAssociatedTokenAddress(mint, this.publicKey);

    try {
      await getAccount(this.connection, ata);
      return true;
    } catch {
      return false;
    }
  }

  async getTokenAccountAddress(tokenMintOrSymbol: string): Promise<PublicKey> {
    const mint = this.resolveMint(tokenMintOrSymbol);
    return await getAssociatedTokenAddress(mint, this.publicKey);
  }

  private resolveMint(tokenMintOrSymbol: string): PublicKey {
    if (this.network === "localnet") {
      const mintInfo = this.tokenManager.getMintInfo(tokenMintOrSymbol);
      if (mintInfo) {
        return mintInfo.address;
      }
    }

    const knownTokens: Record<string, string> = {
      USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    };

    const mintAddress = knownTokens[tokenMintOrSymbol] || tokenMintOrSymbol;

    if (!mintAddress) {
      throw new Error(`Unknown token: ${tokenMintOrSymbol}`);
    }
    return new PublicKey(mintAddress);
  }

  info(): {
    publicKey: string;
    network: Network;
  } {
    return {
      publicKey: this.publicKey.toBase58(),
      network: this.network,
    };
  }

  toJSON(): SerializedWallet {
    return {
      secretKey: Array.from(this.keypair.secretKey),
      publicKey: this.publicKey.toBase58(),
      network: this.network,
    };
  }
}
