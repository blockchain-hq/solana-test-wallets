# solana-test-wallets

A lightweight and efficient wallet management library for Solana testing and local development. Simplify your Solana testing workflow with easy wallet creation, funding, and token management.

## Features

- Create and manage multiple test wallets with ease
- Automatic SOL and SPL token funding on localnet
- Support for multiple networks (localnet, devnet, testnet, mainnet-beta)
- Wallet persistence (save/load from files)
- Built-in token management for localnet testing
- TypeScript support with full type definitions
- Zero configuration for common use cases

## Installation

```bash
npm install solana-test-wallets
```

```bash
pnpm add solana-test-wallets
```

```bash
yarn add solana-test-wallets
```

## Quick Start

### Basic Usage

```typescript
import { TestWallets } from "solana-test-wallets";

// Create a single funded wallet
const wallets = await TestWallets.create({
  count: 1,
  network: "localnet",
  fundSOL: 10,
  fundTokens: { USDC: 100 },
});

const wallet = wallets.next();
console.log("Wallet address:", wallet.publicKey.toBase58());
console.log("SOL balance:", await wallet.getBalance());
console.log("USDC balance:", await wallet.getTokenBalance("USDC"));
```

### Create Multiple Wallets

```typescript
// Create 5 test wallets, each with 10 SOL and 100 USDC
const wallets = await TestWallets.create({
  count: 5,
  network: "localnet",
  fundSOL: 10,
  fundTokens: { USDC: 100 },
});

// Iterate through wallets
const wallet1 = wallets.next();
const wallet2 = wallets.next();
const wallet3 = wallets.next();

// Get all wallets at once
const allWallets = wallets.getAll();
```

### Create a Single Wallet

```typescript
import { TestWallets } from "solana-test-wallets";

const wallet = await TestWallets.createOne({
  network: "localnet",
  fundSOL: 5,
});

console.log("Balance:", await wallet.getBalance(), "SOL");
```

### Save and Load Wallets

```typescript
// Save all wallets to a file
await wallets.saveToFile("my-wallets.json");

// Load wallets from file
const loadedWallets = await TestWallets.loadFromFile("my-wallets.json");

// Save individual wallet
await wallets.saveWalletToFile("wallet-0.json", 0);

// Load individual wallet
const singleWallet = await TestWallets.loadWalletFromFile(
  "wallet-0.json",
  "localnet"
);
```

### Token Operations

```typescript
// Check token balance
const usdcBalance = await wallet.getTokenBalance("USDC");

// Create token account
const tokenAccount = await wallet.createTokenAccount("USDC");

// Check if token account exists
const hasAccount = await wallet.hasTokenAccount("USDC");

// Get token account address
const accountAddress = await wallet.getTokenAccountAddress("USDC");

// Fund wallet with additional tokens
await wallets.fundWalletWithTokens(wallet, "USDC", 50);
```

### Network Configuration

```typescript
// Connect to localnet (default)
const local = await TestWallets.create({
  network: "localnet",
  endpoint: "http://127.0.0.1:8899",
});

// Connect to devnet
const devnet = await TestWallets.create({
  network: "devnet",
  fundSOL: 1,
});

// Connect to custom RPC
const custom = await TestWallets.create({
  network: "devnet",
  endpoint: "https://your-custom-rpc.com",
});
```

## API Reference

### TestWallets Class

#### Static Methods

##### `create(config?: CreateWalletConfig): Promise<TestWallets>`

Creates a new wallet manager with the specified configuration.

**Parameters:**

- `config.count` (number, default: 1) - Number of wallets to create
- `config.network` (Network, default: 'localnet') - Network to connect to
- `config.endpoint` (string, optional) - Custom RPC endpoint
- `config.fundSOL` (number, default: 0) - SOL to fund each wallet
- `config.fundTokens` (Record<string, number>, default: {}) - Tokens to fund each wallet
- `config.label` (string, default: 'default') - Label for the wallet group

##### `createOne(config?: CreateWalletConfig): Promise<TestWallet>`

Creates a single test wallet.

##### `loadFromFile(filename: string): Promise<TestWallets>`

Loads wallets from a saved file.

##### `loadWalletFromFile(filename: string, network: Network): Promise<TestWallets>`

Loads a single wallet from a file.

##### `loadWalletFromFiles(filenames: string[], network: Network): Promise<TestWallets>`

Loads multiple wallets from multiple files.

#### Instance Methods

##### `next(): TestWallet`

Returns the next wallet in rotation.

##### `getAll(): TestWallet[]`

Returns all wallets.

##### `count(): number`

Returns the number of wallets.

##### `saveToFile(filename: string): Promise<void>`

Saves all wallets to a file.

##### `saveWalletToFile(filename: string, index: number): Promise<void>`

Saves a specific wallet to a file.

##### `fundWalletWithTokens(wallet: TestWallet, tokenSymbol: string, amount: number): Promise<void>`

Funds a wallet with additional tokens (localnet only).

##### `list(): Promise<void>`

Lists all wallets with their balances.

##### `getAllBalances(): Promise<void>`

Prints balances for all wallets.

##### `dispose(): Promise<void>`

Cleans up wallet manager resources.

### TestWallet Class

#### Properties

- `keypair` (Keypair) - The underlying Solana keypair
- `publicKey` (PublicKey) - The wallet's public key

#### Methods

##### `getBalance(): Promise<number>`

Returns the wallet's SOL balance.

##### `getTokenBalance(tokenMintOrSymbol: string, decimals?: number): Promise<number>`

Returns the wallet's token balance for a specific token.

##### `createTokenAccount(tokenMintOrSymbol: string): Promise<PublicKey>`

Creates a token account for the wallet.

##### `hasTokenAccount(tokenMintOrSymbol: string): Promise<boolean>`

Checks if the wallet has a token account.

##### `getTokenAccountAddress(tokenMintOrSymbol: string): Promise<PublicKey>`

Gets the associated token account address.

##### `info(): { publicKey: string, network: Network }`

Returns wallet information.

##### `toJSON(): SerializedWallet`

Serializes the wallet to JSON.

## Types

```typescript
type Network = "localnet" | "devnet" | "testnet" | "mainnet-beta";

interface CreateWalletConfig {
  count?: number;
  network?: Network;
  endpoint?: string;
  fundSOL?: number;
  fundTokens?: Record<string, number>;
  label?: string;
}
```

## Use Cases

### Integration Testing

```typescript
import { TestWallets } from "solana-test-wallets";

describe("Token Swap Tests", () => {
  let wallets: TestWallets;

  beforeEach(async () => {
    wallets = await TestWallets.create({
      count: 2,
      network: "localnet",
      fundSOL: 10,
      fundTokens: { USDC: 1000 },
    });
  });

  it("should swap tokens between wallets", async () => {
    const wallet1 = wallets.next();
    const wallet2 = wallets.next();

    // Your swap logic here

    expect(await wallet2.getTokenBalance("USDC")).toBeGreaterThan(0);
  });
});
```

### Local Development

```typescript
// Setup script for local development
import { TestWallets } from "solana-test-wallets";

async function setup() {
  const wallets = await TestWallets.create({
    count: 3,
    network: "localnet",
    fundSOL: 100,
    fundTokens: {
      USDC: 10000,
      CUSTOM: 5000,
    },
  });

  await wallets.saveToFile("dev-wallets.json");
  console.log("Development wallets ready!");
}

setup();
```

## Requirements

- Node.js 16 or higher
- A running Solana validator for localnet testing

## License

MIT License - see LICENSE file for details

## Author

Nirav Joshi

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [Solana Web3.js Documentation](https://solana.com/docs/clients/javascript)
- [SPL Token Documentation](https://spl.solana.com/token)
