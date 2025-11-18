const hre = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS";

  if (contractAddress === "YOUR_CONTRACT_ADDRESS") {
    console.error("❌ Please set CONTRACT_ADDRESS environment variable");
    console.log("Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.js --network sepolia");
    process.exit(1);
  }

  console.log("Interacting with WalletTransfer at:", contractAddress);

  // Get the contract
  const WalletTransfer = await hre.ethers.getContractFactory("WalletTransfer");
  const walletTransfer = WalletTransfer.attach(contractAddress);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);

  // Example: Deposit
  console.log("\n💰 Depositing 0.01 ETH...");
  const depositTx = await walletTransfer.deposit({
    value: hre.ethers.parseEther("0.01")
  });
  await depositTx.wait();
  console.log("✅ Deposit successful!");

  // Check balance
  const balance = await walletTransfer.getBalance(signer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
