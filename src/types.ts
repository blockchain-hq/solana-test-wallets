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
