const hre = require("hardhat");

async function main() {
  console.log("Deploying WalletTransfer  and Message contract...");

  // Get the contract factory
  const WalletTransfer = await hre.ethers.getContractFactory("WalletTransfer");
  // Deploy the WalletTransfer contract
  const walletTransfer = await WalletTransfer.deploy();

  await walletTransfer.waitForDeployment();

  const walletTransferAddress = await walletTransfer.getAddress();
    // Get the contract factory
  const Message = await hre.ethers.getContractFactory("Message");
  // Deploy the Message contract 
  const message = await Message.deploy();
  await message.waitForDeployment();
  const messageAddress = await message.getAddress();
  
  console.log("\n✅ WalletTransfer deployed successfully!");
  console.log("\n✅ Message deployed successfully!");
  console.log("📍 WalletTransfer Contract address:", walletTransferAddress);
  console.log("Message contract deployed at:", messageAddress);
  console.log("📍 Message Contract address:", messageAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("⛓️  Chain ID:", hre.network.config.chainId);

  // Get deployment transaction and receipt
  const walletTransferTx = walletTransfer.deploymentTransaction();
  const messageTx = message.deploymentTransaction();
  let walletTransferBlockNumber = null;
  let messageBlockNumber = null;

  if (walletTransferTx) {
    console.log("📝 WalletTransfer Transaction hash:", walletTransferTx.hash);

    // Wait for transaction receipt to get block number
    const receipt = await walletTransferTx.wait();
    walletTransferBlockNumber = receipt.blockNumber;

    console.log("🔢 WalletTransfer Block number:", walletTransferBlockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
  }

  if (messageTx) {
    console.log("📝 Message Transaction hash:", messageTx.hash);

    // Wait for transaction receipt to get block number
    const receipt = await messageTx.wait();
    messageBlockNumber = receipt.blockNumber;

    console.log("🔢 Message Block number:", messageBlockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
  }

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    WalletTransfer: {
       contractAddress: walletTransferAddress,
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deploymentTxHash: walletTransferTx?.hash,
      blockNumber: walletTransferBlockNumber,
      timestamp: new Date().toISOString()
    },
    Message: {
      contractAddress: messageAddress,
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deploymentTxHash: messageTx?.hash,
      blockNumber: messageBlockNumber,
      timestamp: new Date().toISOString()
    }
  };
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to deployment-info.json");
  console.log("\n📋 Next steps:");
  console.log("1. Update subgraph/subgraph.yaml with the contract address");
  console.log("2. Copy the ABI: cp artifacts/contracts/WalletTransfer.sol/WalletTransfer.json ../subgraph/abis/");
  console.log("3. Copy the ABI: cp artifacts/contracts/Message.sol/Message.json ../subgraph/abis/");
  console.log("4. Update the startBlock in subgraph.yaml");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
