const hre = require("hardhat");

async function main() {
  console.log("Deploying WalletTransfer contract...");

  // Get the contract factory
  const WalletTransfer = await hre.ethers.getContractFactory("WalletTransfer");

  // Deploy the contract
  const walletTransfer = await WalletTransfer.deploy();

  await walletTransfer.waitForDeployment();

  const contractAddress = await walletTransfer.getAddress();

  console.log("\n✅ WalletTransfer deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("⛓️  Chain ID:", hre.network.config.chainId);

  // Get deployment transaction
  const deploymentTx = walletTransfer.deploymentTransaction();
  if (deploymentTx) {
    console.log("📝 Transaction hash:", deploymentTx.hash);
    console.log("🔢 Block number:", deploymentTx.blockNumber);
  }

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deploymentTxHash: deploymentTx?.hash,
    blockNumber: deploymentTx?.blockNumber,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to deployment-info.json");
  console.log("\n📋 Next steps:");
  console.log("1. Update subgraph/subgraph.yaml with the contract address");
  console.log("2. Copy the ABI: cp artifacts/contracts/WalletTransfer.sol/WalletTransfer.json ../subgraph/abis/");
  console.log("3. Update the startBlock in subgraph.yaml");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
