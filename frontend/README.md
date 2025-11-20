# Wallet Transfer Frontend

一个基于 React + Wagmi + TailwindCSS 的 Web3 转账应用，支持 MetaMask 钱包连接和两种转账方式。

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Wagmi v3** - Web3 React Hooks
- **Viem** - 以太坊交互库
- **TailwindCSS** - 样式框架
- **Jotai** - 状态管理
- **React Router** - 路由管理
- **GraphQL Request** - The Graph 查询

## 功能特性

### 钱包功能
- ✅ 连接 MetaMask 钱包
- ✅ 实时显示账户余额（ETH单位）
- ✅ 切换网络（Sepolia、Mainnet、Goerli、Localhost）
- ✅ 切换账户
- ✅ 断开连接
- ✅ 复制钱包地址
- ✅ 显示当前网络状态

### 1. 直接转账 (Direct Transfer)
- 使用 Infura RPC 节点
- 直接发送 ETH 到任意地址
- 查看钱包余额
- 查看最近的链上交易

### 2. 合约转账 (Contract Transfer)
- 通过 WalletTransfer 智能合约转账
- 支持存款、转账功能
- 使用 The Graph 索引交易历史
- 实时查询合约余额

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Infura

编辑 `src/config/wagmi.ts`，替换 `YOUR_INFURA_KEY` 为你的 Infura API Key：

```typescript
export const config = createConfig({
  chains: [sepolia, mainnet, goerli, localhost],
  connectors: [
    injected(), // MetaMask
  ],
  transports: {
    [sepolia.id]: http('https://sepolia.infura.io/v3/YOUR_INFURA_KEY'),
    [mainnet.id]: http('https://mainnet.infura.io/v3/YOUR_INFURA_KEY'),
    [goerli.id]: http('https://goerli.infura.io/v3/YOUR_INFURA_KEY'),
    [localhost.id]: http('http://127.0.0.1:8545'),
  },
});
```

### 3. 配置 Subgraph URL

编辑 `src/constants/subgraph.ts`：

```typescript
export const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/<your-subgraph-id>/wallet-transfer/version/latest';
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 5. 构建生产版本

```bash
npm run build
```

## 使用说明

### 连接钱包

1. 确保已安装 MetaMask 浏览器插件
2. 点击右上角 "Connect MetaMask" 按钮
3. 在 MetaMask 中确认连接

### 切换网络

1. 点击导航栏中的网络选择器（显示当前网络名称）
2. 从下拉菜单中选择目标网络
3. 在 MetaMask 中确认网络切换

支持的网络：
- **Sepolia Testnet** - 以太坊测试网
- **Ethereum Mainnet** - 以太坊主网
- **Goerli Testnet** - Goerli 测试网
- **Localhost** - 本地开发网络

### 切换账户

1. 点击账户信息按钮（显示余额和地址）
2. 在下拉菜单中点击 "切换账户"
3. 在 MetaMask 中选择要切换的账户

### 查看余额

账户余额会实时显示在导航栏右上角，以 ETH 为单位：
- 顶部显示：精确到 4 位小数
- 下拉菜单：精确到 6 位小数，并显示完整值

### 断开连接

1. 点击账户信息按钮
2. 在下拉菜单中点击 "断开连接"

### 直接转账

1. 进入 "Direct Transfer" 页面
2. 输入接收地址和转账金额
3. 点击 "Send Transaction"
4. 在 MetaMask 中确认交易

### 合约转账

1. 进入 "Contract Transfer" 页面
2. 首先存款到合约（左侧表单）
3. 然后进行合约内转账（右侧表单）
4. 点击 "Refresh" 查看 The Graph 索引的交易历史

## 如何获取 Infura API Key

1. 访问 https://infura.io/
2. 注册账号并登录
3. 创建新项目
4. 复制项目的 API Key
5. 将 API Key 粘贴到 `src/config/wagmi.ts` 中

## 如何部署 Subgraph

请参考主项目的 `subgraph` 目录中的说明文档。

## 注意事项

1. **MetaMask 必须安装**: 本应用需要 MetaMask 浏览器插件
2. **测试网 ETH**: 在 Sepolia 测试网使用时需要测试币，可从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取
3. **The Graph 延迟**: 新交易可能需要几分钟才能在 The Graph 中索引
4. **网络费用**: 每次交易都需要支付 gas 费用
5. **合约地址**: WalletTransfer 合约地址已硬编码在 `src/constants/contract.ts`

## 项目结构

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # 导航栏、钱包连接、网络切换
│   ├── config/
│   │   ├── wagmi.ts           # Wagmi 配置（网络、RPC）
│   │   └── atoms.ts           # Jotai 状态管理
│   ├── constants/
│   │   ├── contract.ts        # 合约 ABI 和地址
│   │   └── subgraph.ts        # Subgraph 查询配置
│   ├── pages/
│   │   ├── DirectTransfer.tsx  # 直接转账页面
│   │   └── ContractTransfer.tsx # 合约转账页面
│   ├── App.tsx                # 主应用路由
│   ├── index.css              # TailwindCSS 样式
│   └── main.tsx               # 应用入口
├── package.json
└── README.md
```

## 常见问题

### MetaMask 未连接？

- 确保已安装 MetaMask 浏览器插件
- 刷新页面并重试

### 无法切换网络？

- 某些网络可能需要在 MetaMask 中手动添加
- 确保在 MetaMask 中允许了网络切换权限

### 交易失败？

- 检查账户是否有足够的 ETH 支付 gas 费
- 确认目标地址是否正确
- 查看 MetaMask 中的错误信息

### The Graph 查询失败？

- 确保 Subgraph URL 配置正确
- 检查 Subgraph 是否已成功部署和同步

## 许可证

MIT
