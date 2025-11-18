const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("WalletTransfer", function () {
  // Fixture to deploy the contract
  async function deployWalletTransferFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const WalletTransfer = await ethers.getContractFactory("WalletTransfer");
    const walletTransfer = await WalletTransfer.deploy();

    return { walletTransfer, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { walletTransfer, owner } = await loadFixture(deployWalletTransferFixture);
      expect(await walletTransfer.owner()).to.equal(owner.address);
    });

    it("Should have zero balance initially", async function () {
      const { walletTransfer } = await loadFixture(deployWalletTransferFixture);
      expect(await walletTransfer.getContractBalance()).to.equal(0);
    });
  });

  describe("Deposits", function () {
    it("Should accept deposits", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      const depositAmount = ethers.parseEther("1.0");
      await walletTransfer.connect(addr1).deposit({ value: depositAmount });

      expect(await walletTransfer.getBalance(addr1.address)).to.equal(depositAmount);
    });

    it("Should emit Deposit event", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      const depositAmount = ethers.parseEther("1.0");

      const tx = await walletTransfer.connect(addr1).deposit({ value: depositAmount });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(walletTransfer, "Deposit")
        .withArgs(addr1.address, depositAmount, depositAmount, block.timestamp);
    });

    it("Should reject zero deposits", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      await expect(
        walletTransfer.connect(addr1).deposit({ value: 0 })
      ).to.be.revertedWith("Deposit amount must be greater than 0");
    });

    it("Should accept deposits via receive function", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      const depositAmount = ethers.parseEther("1.0");
      await addr1.sendTransaction({
        to: await walletTransfer.getAddress(),
        value: depositAmount
      });

      expect(await walletTransfer.getBalance(addr1.address)).to.equal(depositAmount);
    });
  });

  describe("Transfers", function () {
    it("Should transfer funds between accounts", async function () {
      const { walletTransfer, addr1, addr2 } = await loadFixture(deployWalletTransferFixture);

      // Deposit first
      const depositAmount = ethers.parseEther("2.0");
      await walletTransfer.connect(addr1).deposit({ value: depositAmount });

      // Transfer
      const transferAmount = ethers.parseEther("1.0");
      await walletTransfer.connect(addr1).transfer(addr2.address, transferAmount);

      expect(await walletTransfer.getBalance(addr1.address)).to.equal(
        depositAmount - transferAmount
      );
      expect(await walletTransfer.getBalance(addr2.address)).to.equal(transferAmount);
    });

    it("Should emit Transfer event", async function () {
      const { walletTransfer, addr1, addr2 } = await loadFixture(deployWalletTransferFixture);

      const depositAmount = ethers.parseEther("2.0");
      await walletTransfer.connect(addr1).deposit({ value: depositAmount });

      const transferAmount = ethers.parseEther("1.0");

      const tx = await walletTransfer.connect(addr1).transfer(addr2.address, transferAmount);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(walletTransfer, "Transfer")
        .withArgs(addr1.address, addr2.address, transferAmount, block.timestamp);
    });

    it("Should reject transfer to zero address", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      await walletTransfer.connect(addr1).deposit({ value: ethers.parseEther("1.0") });

      await expect(
        walletTransfer.connect(addr1).transfer(ethers.ZeroAddress, ethers.parseEther("0.5"))
      ).to.be.revertedWith("Cannot transfer to zero address");
    });

    it("Should reject transfer with insufficient balance", async function () {
      const { walletTransfer, addr1, addr2 } = await loadFixture(deployWalletTransferFixture);

      await walletTransfer.connect(addr1).deposit({ value: ethers.parseEther("1.0") });

      await expect(
        walletTransfer.connect(addr1).transfer(addr2.address, ethers.parseEther("2.0"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should reject zero amount transfers", async function () {
      const { walletTransfer, addr1, addr2 } = await loadFixture(deployWalletTransferFixture);

      await walletTransfer.connect(addr1).deposit({ value: ethers.parseEther("1.0") });

      await expect(
        walletTransfer.connect(addr1).transfer(addr2.address, 0)
      ).to.be.revertedWith("Transfer amount must be greater than 0");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow withdrawals", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      const depositAmount = ethers.parseEther("2.0");
      await walletTransfer.connect(addr1).deposit({ value: depositAmount });

      const withdrawAmount = ethers.parseEther("1.0");
      const balanceBefore = await ethers.provider.getBalance(addr1.address);

      const tx = await walletTransfer.connect(addr1).withdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(addr1.address);

      expect(await walletTransfer.getBalance(addr1.address)).to.equal(
        depositAmount - withdrawAmount
      );
      expect(balanceAfter).to.equal(balanceBefore + withdrawAmount - gasUsed);
    });

    it("Should emit Withdrawal event", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      await walletTransfer.connect(addr1).deposit({ value: ethers.parseEther("2.0") });

      const withdrawAmount = ethers.parseEther("1.0");

      const tx = await walletTransfer.connect(addr1).withdraw(withdrawAmount);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(walletTransfer, "Withdrawal")
        .withArgs(addr1.address, withdrawAmount, ethers.parseEther("1.0"), block.timestamp);
    });

    it("Should reject withdrawal with insufficient balance", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      await walletTransfer.connect(addr1).deposit({ value: ethers.parseEther("1.0") });

      await expect(
        walletTransfer.connect(addr1).withdraw(ethers.parseEther("2.0"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should reject zero amount withdrawals", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      await walletTransfer.connect(addr1).deposit({ value: ethers.parseEther("1.0") });

      await expect(
        walletTransfer.connect(addr1).withdraw(0)
      ).to.be.revertedWith("Withdrawal amount must be greater than 0");
    });
  });

  describe("Balance Queries", function () {
    it("Should return correct balance", async function () {
      const { walletTransfer, addr1 } = await loadFixture(deployWalletTransferFixture);

      expect(await walletTransfer.getBalance(addr1.address)).to.equal(0);

      await walletTransfer.connect(addr1).deposit({ value: ethers.parseEther("5.0") });

      expect(await walletTransfer.getBalance(addr1.address)).to.equal(ethers.parseEther("5.0"));
    });

    it("Should return correct contract balance", async function () {
      const { walletTransfer, addr1, addr2 } = await loadFixture(deployWalletTransferFixture);

      await walletTransfer.connect(addr1).deposit({ value: ethers.parseEther("3.0") });
      await walletTransfer.connect(addr2).deposit({ value: ethers.parseEther("2.0") });

      expect(await walletTransfer.getContractBalance()).to.equal(ethers.parseEther("5.0"));
    });
  });

  // Helper function to get current block timestamp
  async function getBlockTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block.timestamp;
  }
});
