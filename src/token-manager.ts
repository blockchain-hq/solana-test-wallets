import {
  Keypair,
  LAMPORTS_PER_SOL,
  type Connection,
  PublicKey,
} from "@solana/web3.js";
import type { MintInfo, Network, SerializedMintInfo } from "./types.js";
import type { TestWallet } from "./test-wallet.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

export class TokenManager {
  private connection: Connection;
  private network: Network;

  private mints: Map<string, MintInfo> = new Map();
  private knownMints: Record<string, string> = {
    USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  };

  constructor(connection: Connection, network: Network) {
    this.connection = connection;
    this.network = network;
  }

  async fundWalletWithTokens(
    wallet: TestWallet,
    tokenSymbol: string,
    amount: number
  ) {
    if (this.network === "localnet") {
      await this.fundOnLocalnet(wallet.keypair, tokenSymbol, amount);
    } else {
      throw new Error(`Funding tokens on ${this.network} is not supported`);
    }
  }

  private async fundOnLocalnet(
    wallet: Keypair,
    tokenSymbol: string,
    amount: number
  ) {
    let mintInfo = this.mints.get(tokenSymbol);

    if (!mintInfo) {
      // generate new mint authority
      const mintAuthority = Keypair.generate();

      // fund the mint authority
      const airdropSig = await this.connection.requestAirdrop(
        mintAuthority.publicKey,
        LAMPORTS_PER_SOL * 10
      );
      await this.connection.confirmTransaction(airdropSig, "confirmed");

      // create the mint
      const mint = await createMint(
        this.connection,
        mintAuthority,
        mintAuthority.publicKey,
        null,
        6
      );

      mintInfo = { address: mint, authority: mintAuthority };
      this.mints.set(tokenSymbol, mintInfo);
    }

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      wallet,
      mintInfo.address,
      wallet.publicKey
    );

    const amountInSmallestUnits = amount * Math.pow(10, 6);
    await mintTo(
      this.connection,
      wallet,
      mintInfo.address,
      tokenAccount.address,
      mintInfo.authority,
      amountInSmallestUnits
    );
  }

  getMintAddress(tokenSymbol: string): PublicKey | null {
    const address = this.knownMints[tokenSymbol];
    return address ? new PublicKey(address) : null;
  }

  getMintInfo(tokenSymbol: string): MintInfo | null {
    return this.mints.get(tokenSymbol) || null;
  }

  getMints(): Record<string, SerializedMintInfo> {
    const mints: Record<string, SerializedMintInfo> = {};
    for (const [symbol, info] of this.mints.entries()) {
      mints[symbol] = {
        address: info.address.toBase58(),
        authority: Array.from(info.authority.secretKey),
      };
    }
    return mints;
  }

  updateMints(mints: Record<string, SerializedMintInfo>) {
    for (const [symbol, mintInfo] of Object.entries(mints)) {
      this.mints.set(symbol, {
        address: this.deserializeMintInfo(mintInfo).address,
        authority: this.deserializeMintInfo(mintInfo).authority,
      });
    }
  }

  private deserializeMintInfo(mintInfo: SerializedMintInfo): MintInfo {
    return {
      address: new PublicKey(mintInfo.address),
      authority: Keypair.fromSecretKey(Uint8Array.from(mintInfo.authority)),
    };
  }
}
