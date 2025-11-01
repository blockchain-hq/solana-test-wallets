import type { Keypair, PublicKey } from "@solana/web3.js";

export type Network = "localnet" | "devnet" | "testnet" | "mainnet-beta";

export interface WalletConfig {
  fundSOL?: number;
  fundTokens?: Record<string, number>;
}

export interface CreateWalletConfig extends WalletConfig {
  network?: Network;
  endpoint?: string;
  wallets?: WalletConfig[];
}

export interface MintInfo {
  address: PublicKey;
  authority: Keypair;
}

export interface TokenManagerState {
  mints: Map<string, MintInfo>;
}
