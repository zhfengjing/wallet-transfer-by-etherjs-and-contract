// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

// public,external,internal,private
// public: 任何人都可以调用，包括合约外部和内部
// external: 只能被合约外部调用和用户调用，不能在当前合约内部调用，external 不能用于声明变量，仅可用于函数
// internal: 只能在合约内部或继承的合约中调用，不能被合约外部调用，即外部合约或账户无法访问这个成员
// private: 只能在当前合约内部调用，不能被继承的合约或合约外部调用，private 是最严格的访问控制，只允许合约内部使用。
// 访问修饰符总结
// 修饰符	 适用对象	 访问权限范围	        是否生成 getter
// public	函数、变量	外部、内部、继承合约	 是
// external	函数	   仅外部调用	          否
// internal	函数、变量	当前合约及继承合约	     否
// private	函数、变量	仅当前合约内部	        否

contract Message {
    // 消息结构体
    struct MessageData {
        address sender;
        string content;
        uint256 timestamp;
    }

    MessageData[] public messages;

    // Event for new messages
    event NewMessage(address indexed sender, string content, uint256 timestamp);

    // 发送消息
    function sendMessage(string calldata _content) public {
        messages.push(
            MessageData({
                sender: msg.sender,
                content: _content,
                timestamp: block.timestamp
            })
        );
        emit NewMessage(msg.sender, _content, block.timestamp);
    }

    // 获取所有消息
    function getMessages() public view returns (MessageData[] memory) {
        return messages;
    }

    // 根据地址获取消息
    function getMessageByAddress(
        address _sender
    ) public view returns (MessageData[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < messages.length; i++) {
            if (messages[i].sender == _sender) {
                count++;
            }
        }

        MessageData[] memory result = new MessageData[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < messages.length; i++) {
            if (messages[i].sender == _sender) {
                result[index] = messages[i];
                index++;
            }
        }

        return result;
    }
}
