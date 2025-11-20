# 快速开始指南

## 前置要求

1. **安装 MetaMask**
   - 访问 https://metamask.io/
   - 下载并安装浏览器插件
   - 创建或导入钱包

2. **获取 Infura API Key**
   - 访问 https://infura.io/
   - 注册并创建项目
   - 复制 API Key

3. **获取测试币（可选）**
   - Sepolia: https://sepoliafaucet.com/
   - 输入你的钱包地址
   - 等待接收测试 ETH

---

## 安装步骤

### 1. 克隆或下载项目

```bash
cd wallet-transfer-by-etherjs-and-contract/frontend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 Infura

打开 `src/config/wagmi.ts`，找到以下内容：

```typescript
transports: {
  [sepolia.id]: http('https://sepolia.infura.io/v3/YOUR_INFURA_KEY'),
  [mainnet.id]: http('https://mainnet.infura.io/v3/YOUR_INFURA_KEY'),
  [goerli.id]: http('https://goerli.infura.io/v3/YOUR_INFURA_KEY'),
  [localhost.id]: http('http://127.0.0.1:8545'),
},
```

将所有 `YOUR_INFURA_KEY` 替换为你的实际 API Key。

### 4. 配置 Subgraph（可选）

如果要使用合约转账功能的交易历史查询，需要配置 Subgraph URL。

打开 `src/constants/subgraph.ts`：

```typescript
export const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/<your-id>/wallet-transfer/version/latest';
```

替换 `<your-id>` 为你的实际 Subgraph ID。

### 5. 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 http://localhost:5173

---

## 第一次使用

### 连接 MetaMask

1. 点击右上角 **"Connect MetaMask"** 按钮
2. MetaMask 会弹出连接请求
3. 点击 **"下一步"** 和 **"连接"**
4. 连接成功后会显示你的地址和余额

### 切换到测试网

1. 点击网络选择器（显示当前网络）
2. 选择 **"Sepolia Testnet"**
3. MetaMask 会提示切换网络
4. 点击 **"切换网络"**

---

## 功能演示

### 1. 查看余额

连接后，余额会自动显示在导航栏：
- **简略显示**: 0.1234 ETH
- **详细显示**: 点击账户按钮查看完整余额

### 2. 直接转账（测试）

进入 **Direct Transfer** 页面：

1. 输入接收地址（可以用另一个测试地址）
2. 输入金额，如 `0.001`
3. 点击 **"Send Transaction"**
4. 在 MetaMask 中确认
5. 等待交易完成

### 3. 合约转账（测试）

进入 **Contract Transfer** 页面：

**第一步：存款到合约**
1. 在左侧表单输入金额，如 `0.01`
2. 点击 **"Deposit"**
3. 在 MetaMask 中确认
4. 等待交易完成

**第二步：合约内转账**
1. 在右侧表单输入接收地址
2. 输入金额，如 `0.001`
3. 点击 **"Transfer"**
4. 在 MetaMask 中确认
5. 点击 **"Refresh"** 查看交易历史

---

## 常用操作

### 切换账户

1. 点击账户按钮（右上角）
2. 选择 **"切换账户"**
3. 在 MetaMask 中选择其他账户

### 复制地址

1. 点击账户按钮
2. 点击地址旁边的复制图标
3. 地址已复制到剪贴板

### 断开连接

1. 点击账户按钮
2. 选择 **"断开连接"**（红色按钮）

---

## 故障排除

### 问题 1: 无法连接 MetaMask

**解决方案**:
- 确认已安装 MetaMask 插件
- 刷新页面重试
- 检查 MetaMask 是否已解锁

### 问题 2: 余额显示为 0

**可能原因**:
- 钱包中确实没有 ETH
- RPC 连接失败
- 网络选择错误

**解决方案**:
- 确认当前网络
- 在区块浏览器查询实际余额
- 从水龙头获取测试币

### 问题 3: 交易失败

**可能原因**:
- 余额不足支付 gas 费用
- Gas 价格设置过低
- 网络拥堵

**解决方案**:
- 检查余额是否充足
- 在 MetaMask 中增加 gas 费用
- 稍后重试

### 问题 4: The Graph 查询失败

**原因**:
- Subgraph URL 未配置
- Subgraph 未部署
- 网络连接问题

**解决方案**:
- 检查 `src/constants/subgraph.ts` 配置
- 确认 Subgraph 已成功部署
- 查看浏览器控制台错误信息

---

## 开发提示

### 查看日志

打开浏览器开发者工具（F12）：
- **Console**: 查看错误和日志
- **Network**: 查看网络请求
- **Application**: 查看本地存储

### 清除缓存

如果遇到奇怪的问题：
1. 清除浏览器缓存
2. 刷新页面
3. 重新连接 MetaMask

### 测试网络

建议使用 Sepolia 测试网进行开发：
- 免费的测试币
- 稳定的网络
- 与主网类似的环境

---

## 下一步

### 学习资源

- **Wagmi 文档**: https://wagmi.sh/
- **Viem 文档**: https://viem.sh/
- **MetaMask 文档**: https://docs.metamask.io/
- **The Graph 文档**: https://thegraph.com/docs/

### 扩展功能

尝试添加以下功能：
- ERC20 代币支持
- 交易历史导出
- 多签钱包集成
- NFT 展示

### 部署到生产

准备好后，可以：
1. 运行 `npm run build`
2. 将 `dist` 目录部署到服务器
3. 配置自定义域名

---

## 获取帮助

遇到问题？

1. 查看 README.md
2. 查看 FEATURES.md
3. 检查浏览器控制台
4. 查阅官方文档
5. 提交 Issue

---

祝你使用愉快！ 🚀
