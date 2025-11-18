# WalletTransfer Smart Contract

一个简单但功能完整的以太坊钱包合约，支持存款、转账和提款功能。

## 合约功能

- **存款 (Deposit)**: 用户可以向合约存入 ETH
- **转账 (Transfer)**: 用户可以将余额转给其他地址
- **提款 (Withdraw)**: 用户可以提取余额到自己的钱包
- **余额查询**: 查询用户余额和合约总余额

## 安全特性

- ✅ ReentrancyGuard - 防止重入攻击
- ✅ Ownable - 所有权管理
- ✅ OpenZeppelin v5 - 使用经过审计的库
- ✅ 完整的测试覆盖 (17个测试全部通过)

## 项目结构

```
contract/
├── contracts/
│   └── WalletTransfer.sol      # 主合约
├── scripts/
│   ├── deploy.js               # 部署脚本
│   └── interact.js             # 交互脚本
├── test/
│   └── WalletTransfer.test.js  # 测试文件
├── hardhat.config.js           # Hardhat 配置
├── package.json
└── .env.example                # 环境变量示例
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 编译合约

```bash
npm run compile
```

### 3. 运行测试

```bash
npm test
```

### 4. 部署到本地网络

```bash
# 启动本地节点
npm run node

# 在新终端部署
npm run deploy:local
```

### 5. 部署到测试网 (Sepolia)

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 编辑 .env 文件，填入你的配置：
# - SEPOLIA_RPC_URL: Alchemy/Infura RPC URL
# - PRIVATE_KEY: 你的钱包私钥（不含 0x）

# 3. 部署
npm run deploy:sepolia
```

## 事件

合约会发出以下事件，可以被 Subgraph 索引：

```solidity
event Deposit(address indexed user, uint256 amount, uint256 newBalance, uint256 timestamp);
event Transfer(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
event Withdrawal(address indexed user, uint256 amount, uint256 newBalance, uint256 timestamp);
```

## 与 Subgraph 集成

部署合约后：

```bash
# 1. 复制 ABI 到 subgraph
cp artifacts/contracts/WalletTransfer.sol/WalletTransfer.json ../subgraph/abis/

# 2. 更新 ../subgraph/subgraph.yaml：
#    - 合约地址
#    - startBlock（从 deployment-info.json 获取）
#    - 网络名称

# 3. 在 subgraph 目录运行
cd ../subgraph
npm run codegen
npm run build
```

## 测试覆盖

- ✅ 部署测试
- ✅ 存款功能测试
- ✅ 转账功能测试
- ✅ 提款功能测试
- ✅ 余额查询测试
- ✅ 事件触发测试
- ✅ 错误处理测试

## 许可证

MIT
