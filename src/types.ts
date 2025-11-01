import type { Keypair, PublicKey } from "@solana/web3.js";

export type Network = "localnet" | "devnet" | "testnet" | "mainnet-beta";

export interface WalletConfig {
  network?: Network;
  endpoint?: string;
  fundSOL?: number;
  fundTokens?: Record<string, number>;
}

export interface CreateWalletConfig extends WalletConfig {
  count?: number;
  label?: string;
}

export interface MintInfo {
  address: PublicKey;
  authority: Keypair;
}

export interface TokenManagerState {
  mints: Map<string, MintInfo>;
}
