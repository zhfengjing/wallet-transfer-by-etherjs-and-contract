// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WalletTransfer
 * @dev A simple wallet contract that allows deposits, transfers, and withdrawals
 */
contract WalletTransfer is ReentrancyGuard, Ownable {
    // Mapping to track user balances
    mapping(address => uint256) public balances;

    // Events
    event Deposit(address indexed user, uint256 amount, uint256 newBalance, uint256 timestamp);
    event Transfer(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 newBalance, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deposit ETH into the contract
     */
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        balances[msg.sender] += msg.value;

        emit Deposit(msg.sender, msg.value, balances[msg.sender], block.timestamp);
    }

    /**
     * @dev Transfer funds to another address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(address to, uint256 amount) external nonReentrant {
        require(to != address(0), "Cannot transfer to zero address");
        require(amount > 0, "Transfer amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount, block.timestamp);
    }

    /**
     * @dev Withdraw funds from the contract
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount, balances[msg.sender], block.timestamp);
    }

    /**
     * @dev Get balance of an address
     * @param user Address to query
     */
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /**
     * @dev Get contract's total ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Receive function to accept direct ETH transfers
     */
    receive() external payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value, balances[msg.sender], block.timestamp);
    }
}
