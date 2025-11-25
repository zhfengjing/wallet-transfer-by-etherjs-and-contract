// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MetaCoin is ERC20 {
    string public constant NAME = "YidengERC20Token";
    //缩写
    string public constant SYMBOL = "YD";

    //发布总数量 估值和融资情况 mint+burn
    // 代币分布
    /**
     * 1.初创团队 20%
     * 2.对外融资 30%
     * 3.社区空投 10%
     * 4.生态建设 20%
     * 5.储备金 20% 金库
     */
    uint256 public constant INITIAL_SUPPLY = 1000000;

    constructor() ERC20(NAME, SYMBOL) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    //设置基本的单位

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    // function name(type name) {
    //     return ""
    // }
}
