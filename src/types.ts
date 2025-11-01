import type { Keypair, PublicKey } from "@solana/web3.js";

export type Network = "localnet" | "devnet" | "testnet" | "mainnet-beta";

export interface WalletConfig {
  fundSOL?: number;
  fundTokens?: Record<string, number>;
}

export interface CreateWalletConfig extends WalletConfig {
  label?: string;
  count?: number;
  network?: Network;
  endpoint?: string;
}

export interface MintInfo {
  address: PublicKey;
  authority: Keypair;
}

export interface TokenManagerState {
  mints: Map<string, MintInfo>;
}

export interface SerializedWallet {
  secretKey: number[];
  publicKey: string;
  network: Network;
}

export interface SerializedWalletCollection {
  version: string;
  wallets: SerializedWallet[];
  network: Network;
}
