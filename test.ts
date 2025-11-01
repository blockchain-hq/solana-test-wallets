import { TestWallets } from "./src/index.js";

const test = async () => {
  console.log("Testing solana-test-wallets");

  const wallets = await TestWallets.create({
    endpoint: "http://127.0.0.1:8899",
    network: "localnet",
    wallets: [
      { fundSOL: 2, fundTokens: { USDC: 100 } },
      { fundSOL: 5, fundTokens: { USDC: 50 } },
    ],
  });

  // test rotation
  const wallet1 = wallets.next();
  console.log(`Wallet 1: ${wallet1.publicKey.toBase58()}`);

  const wallet2 = wallets.next();
  console.log(`Wallet 2: ${wallet2.publicKey.toBase58()}`);

  const wallet3 = wallets.next();
  console.log(`Wallet 3: ${wallet3.publicKey.toBase58()}`);

  const wallet4 = wallets.next();
  console.log(`Wallet 4: ${wallet4.publicKey.toBase58()}`);

  // check balance
  const balance1 = await wallet1.getBalance();
  console.log(`Balance 1: ${balance1} SOL`);

  const usdcBalance1 = await wallet1.getTokenBalance("USDC");
  console.log(`USDC Balance 1: ${usdcBalance1}`);
};

test().catch(console.error);
