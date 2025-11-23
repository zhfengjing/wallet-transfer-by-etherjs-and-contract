// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

contract RedPacket{
    address public owner;//发布合约主体
    uint8 public totalPackets;//红包数量
    uint8 public remainingPackets;//剩余红包数量
    uint256 public totalAmount;//红包总金额
    uint256 public remainingAmount;//红包剩余金额
    bool public isEqual;//是否均分
    uint256 public currentRoundId;//当前红包轮次ID
    mapping (uint256 => mapping(address => bool)) isGrabbed;//是否已抢过红包，按轮次记录

    constructor() {
        owner = msg.sender;
        currentRoundId = 0;
    }

    // Event for red packet publication
    event RedPacketPublished(address indexed owner, uint8 totalPackets, uint256 totalAmount, bool isEqual, uint256 timestamp);
    // Event for red packet grabbed
    event RedPacketGrabbed(address indexed grabber, uint256 amount, uint256 timestamp);
    // Event for unclaimed red packet reclaimed
    event RedPacketReclaimed(address indexed owner, uint256 amount, uint256 timestamp);

    // 发布红包
    function publishRedPacket(uint8 _totalPackets, uint256 _totalAmount, bool _isEqual) external payable {
        require(msg.sender == owner, "Only owner can publish red packet");
        require(_totalPackets > 0, "Total packets must be greater than 0");
        require(_totalAmount > 0, "Total amount must be greater than 0");
        require(remainingPackets == 0, "Previous red packet not finished");

        currentRoundId++; // 开启新一轮红包
        totalPackets = _totalPackets;
        remainingPackets = _totalPackets;
        totalAmount = _totalAmount;
        remainingAmount = _totalAmount;
        isEqual = _isEqual;
        emit RedPacketPublished(owner, totalPackets, totalAmount, isEqual, block.timestamp);
    }

    // 抢红包
    function grabRedPacket() external {
        require(remainingPackets > 0, "No remaining packets");
        require(!isGrabbed[currentRoundId][msg.sender], "You have already grabbed a packet");
        uint256 amount;//每个红包的金额
        if(isEqual){
            amount = totalAmount / totalPackets;
        }else{
            if(remainingPackets == 1){
                amount = remainingAmount;
            }else{
                // 随机金额，最少1wei，最多remainingAmount - (remainingPackets - 1)
                uint256 maxAmount = remainingAmount - (remainingPackets - 1);
                amount = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, remainingAmount))) % (maxAmount - 1) + 1;
            }
        }
        payable(msg.sender).transfer(amount);
        isGrabbed[currentRoundId][msg.sender] = true;
        remainingPackets--;
        remainingAmount -= amount;
        emit RedPacketGrabbed(msg.sender, amount, block.timestamp);
    }

    // 取回未领完的红包
    function reclaimUnclaimed() external {
        require(msg.sender == owner, "Only owner can reclaim unclaimed packets");
        require(remainingPackets > 0, "No remaining packets to reclaim");
        uint256 amount = remainingAmount;
        remainingPackets = 0;
        remainingAmount = 0;
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");
        emit RedPacketReclaimed(owner, amount, block.timestamp);
    }

    // 合约余额
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // 查询用户在当前轮次是否已抢过红包
    function hasGrabbedCurrentRound(address user) external view returns (bool) {
        return isGrabbed[currentRoundId][user];
    }
}
