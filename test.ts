import { TestWallets } from "./src/index.js";

const test = async () => {
  console.log("Testing solana-test-wallets");

  const wallets = await TestWallets.create({
    count: 4,
    endpoint: "http://127.0.0.1:8899",
    network: "localnet",
    label: "test",
    fundSOL: 10,
    fundTokens: { USDC: 100 },
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

  console.log("Saving wallets to file");
  await wallets.saveToFile("test-wallets.json");
  await wallets.saveWalletToFile("first-wallet.json", 0);
  console.log("Saved wallets to file");

  const loaded = await TestWallets.loadFromFile("test-wallets.json");
  console.log("Loaded wallets from file");
  await loaded.list();

  const single = await TestWallets.loadWalletFromFile(
    "first-wallet.json",
    "localnet"
  );
  console.log("Loaded single wallet from file");
  const wallet = single.next();
  console.log(`Single Wallet: ${wallet.publicKey.toBase58()}`);
  const balance = await wallet.getBalance();
  console.log(`Single Wallet Balance: ${balance} SOL`);
  const usdcBalance = await wallet.getTokenBalance("USDC");
  console.log(`Single Wallet USDC Balance: ${usdcBalance}`);
};

test().catch(console.error);
