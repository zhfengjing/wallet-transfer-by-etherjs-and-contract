// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Crowdfunding
 * @dev 一个简单的众筹合约示例
 */
contract Crowdfunding {
    // 状态变量
    address public owner; // 项目发起人
    uint256 public goal; // 众筹目标金额
    uint256 public deadline; // 截止时间
    uint256 public totalFunded; // 已筹集金额
    bool public fundingGoalReached; // 是否达到目标
    bool public crowdsaleClosed; // 众筹是否关闭

    // 记录每个贡献者的出资金额
    mapping(address => uint256) public contributions;

    // 事件 - 记录资金转移和目标达成
    event FundTransfer(
        address indexed backer,
        uint256 amount,
        bool isContribution
    );
    //目标达成事件
    event GoalReached(address recipient, uint256 totalAmountRaised);

    // 修饰器:只允许所有者调用
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    // 修饰器:众筹结束后才能调用
    modifier afterDeadline() {
        require(block.timestamp >= deadline, "Deadline has not passed");
        _;
    }

    /**
     * @dev 构造函数
     * @param fundingGoalInEther 众筹目标(以ETH为单位)
     * @param durationInMinutes 持续时间(分钟)
     */
    constructor(uint256 fundingGoalInEther, uint256 durationInMinutes) {
        owner = msg.sender;
        goal = fundingGoalInEther * 1 ether;
        deadline = block.timestamp + (durationInMinutes * 1 minutes);
    }

    /**
     * @dev 贡献函数 - 接收ETH
     */
    function contribute() public payable {
        require(!crowdsaleClosed, "Crowdsale is closed");
        require(block.timestamp < deadline, "Deadline has passed");
        require(msg.value > 0, "Contribution must be greater than 0");
        //参与了众筹
        contributions[msg.sender] += msg.value;
        totalFunded += msg.value;

        emit FundTransfer(msg.sender, msg.value, true);
    }

    /**
     * @dev 检查是否达到目标
     */
    function checkGoalReached() public afterDeadline {
        if (totalFunded >= goal) {
            fundingGoalReached = true;
            emit GoalReached(owner, totalFunded);
        }
        crowdsaleClosed = true;
    }

    /**
     * @dev 提取资金 - 只有所有者可以调用,且达到目标后
     */
    function withdraw() public onlyOwner afterDeadline {
        require(fundingGoalReached, "Funding goal not reached");
        require(!crowdsaleClosed || totalFunded >= goal, "Cannot withdraw");

        uint256 amount = address(this).balance;
        payable(owner).transfer(amount);
    }

    /**
     * @dev 退款 - 如果未达到目标,贡献者可以退款
     */
    function refund() public afterDeadline {
        require(!fundingGoalReached, "Goal was reached, no refunds");
        require(contributions[msg.sender] > 0, "No contribution found");

        uint256 amount = contributions[msg.sender];
        contributions[msg.sender] = 0;

        payable(msg.sender).transfer(amount);
        emit FundTransfer(msg.sender, amount, false);
    }

    /**
     * @dev 获取合约余额
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev 获取剩余时间(秒)
     */
    function getTimeLeft() public view returns (uint256) {
        if (block.timestamp >= deadline) {
            return 0;
        }
        return deadline - block.timestamp;
    }

    // 允许合约接收ETH
    //接受的回调函数
    receive() external payable {
        contribute();
    }
}
