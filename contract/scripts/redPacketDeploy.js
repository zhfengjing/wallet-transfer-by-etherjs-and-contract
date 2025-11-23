const hre = require("hardhat");

async function main() {
  console.log("Deploying RedPacket contract...");

  // Get the contract factory
  const RedPacket = await hre.ethers.getContractFactory("RedPacket");
  // Deploy the RedPacket contract
  const redPacket = await RedPacket.deploy();

  await redPacket.waitForDeployment();

  const redPacketAddress = await redPacket.getAddress();

  console.log("\n✅ RedPacket deployed successfully!");
  console.log("📍 RedPacket Contract address:", redPacketAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("⛓️  Chain ID:", hre.network.config.chainId);

  // Get deployment transaction and receipt
  const redPacketTx = redPacket.deploymentTransaction();
  let redPacketBlockNumber = null;

  if (redPacketTx) {
    console.log("📝 RedPacket Transaction hash:", redPacketTx.hash);

    // Wait for transaction receipt to get block number
    const receipt = await redPacketTx.wait();
    redPacketBlockNumber = receipt.blockNumber;

    console.log("🔢 RedPacket Block number:", redPacketBlockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
  }

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    RedPacket: {
      contractAddress: redPacketAddress,
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deploymentTxHash: redPacketTx?.hash,
      blockNumber: redPacketBlockNumber,
      timestamp: new Date().toISOString()
    },
  };
  const deploymentCurInfo = fs.readFileSync("deployment-info.json");
  console.log(' deploymentCurInfo:', deploymentCurInfo,deploymentCurInfo.toString());
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify({ ...JSON.parse(deploymentCurInfo), ...deploymentInfo }, null, 2)
  );

  console.log("\n💾 Deployment info saved to deployment-info.json");
  console.log("\n📋 Next steps:");
  console.log("1. Update subgraph/subgraph.yaml with the contract address");
  console.log("2. Copy the ABI: cp artifacts/contracts/RedPacket.sol/RedPacket.json ../subgraph/abis/");
  console.log("3. Update the startBlock in subgraph.yaml");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
