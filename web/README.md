# Web3 钱包转账 Demo - Ethers.js v6 + The Graph

功能完整的以太坊钱包转账演示项目，包含两种链上数据读取方式、网络切换功能和加密消息传输。

## ✨ 核心功能

### 1. 钱包连接与管理
- ✅ 连接 MetaMask 钱包
- ✅ 右上角显示钱包地址和当前网络
- ✅ 支持多网络切换（Ethereum、Sepolia、Polygon、BSC）
- ✅ 实时显示余额和网络信息
- ✅ 自动监听账户和网络变化

### 2. 双重数据读取方式

#### 方式一：Ethers.js v6
- 直接从区块链节点读取数据
- 遍历最近的区块查找交易
- 获取完整的交易详情和收据信息

#### 方式二：The Graph
- 使用 GraphQL 查询索引数据
- 支持复杂的查询条件
- 提供模拟数据演示功能
- 可扩展到真实的 Subgraph

### 3. 加密转账功能
- ✅ 发送 ETH 转账
- ✅ 消息自动加密为16进制数据
- ✅ 使用 XOR 加密算法
- ✅ 加密数据存储在交易的 data 字段
- ✅ 实时显示交易状态

### 4. 自动解密功能
- ✅ 读取交易时自动解密16进制数据
- ✅ 在交易历史中显示解密后的消息
- ✅ 独立的加密/解密工具测试

### 5. 网络切换
- ✅ 右上角网络选择器
- ✅ 支持一键切换网络
- ✅ 自动添加新网络到 MetaMask
- ✅ 实时更新网络状态

## 🏗️ 项目结构

```
wallet-transfer-etherjs/
├── index.html          # 主页面（带顶部导航栏）
├── app.js              # 应用主逻辑（Ethers.js v6）
├── crypto.js           # 加密/解密工具类
├── thegraph.js         # The Graph 服务类
├── styles.css          # 响应式样式
└── README.md           # 项目文档
```

## 📋 技术栈

- **Ethers.js v6.13.0**: 最新版以太坊 JavaScript 库
- **The Graph**: GraphQL 链上数据索引
- **MetaMask**: 浏览器钱包扩展
- **原生 JavaScript (ES6+)**: 模块化开发
- **XOR 加密**: 简单的对称加密算法

## 🚀 快速开始

### 1. 前置要求

- 安装 [MetaMask](https://metamask.io/) 浏览器扩展
- 准备测试网络的测试币（推荐使用 Sepolia）

### 2. 启动项目

项目使用 ES6 模块，需要通过 HTTP 服务器运行：

```bash
# 进入项目目录
cd /Users/scenery/Desktop/project/web3_housework/my_web3_assignment/wallet-transfer-etherjs

# 方法一：使用 Python
python3 -m http.server 8000

# 方法二：使用 Node.js
npx http-server -p 8000

# 方法三：使用 PHP
php -S localhost:8000
```

### 3. 访问应用

在浏览器中打开: `http://localhost:8000`

## 📖 使用指南

### 步骤 1: 连接钱包

1. 点击右上角的 "连接 MetaMask" 按钮
2. 在 MetaMask 弹窗中选择账户并确认连接
3. 连接成功后会显示钱包地址和余额

### 步骤 2: 切换网络

1. 点击右上角的网络选择器
2. 选择目标网络（建议使用 Sepolia 测试网）
3. 在 MetaMask 中确认网络切换

### 步骤 3: 发送加密转账

1. 输入接收地址（以太坊地址格式）
2. 输入转账金额（ETH）
3. 输入要加密的消息（可选）
4. 点击 "发送交易" 按钮
5. 在 MetaMask 中确认交易
6. 等待交易确认

### 步骤 4: 查询交易历史

#### 使用 Ethers.js 查询：
- 点击 "使用 Ethers.js 查询" 按钮
- 系统会遍历最近100个区块
- 自动解密交易中的消息

#### 使用 The Graph 查询：
- 点击 "使用 The Graph 查询" 按钮
- 系统会通过 GraphQL 查询数据
- 显示格式化的交易列表

### 步骤 5: 测试加密/解密

1. 在加密工具中输入明文
2. 点击 "加密为16进制" 按钮
3. 复制生成的16进制密文
4. 在解密工具中粘贴密文
5. 点击 "解密" 按钮查看结果

## 🔐 加密机制详解

### 加密过程

```javascript
1. 用户输入消息: "Hello Blockchain"
2. 转换为字节数组: [72, 101, 108, 108, 111, ...]
3. XOR 加密处理: bytes[i] ^ key[i % keyLength]
4. 转换为16进制: "48656c6c6f20426c6f636b636861696e"
5. 添加0x前缀存储到链上
```

### 解密过程

```javascript
1. 从链上读取数据: "0x48656c6c6f20426c6f636b636861696e"
2. 移除0x前缀
3. 转换为字节数组
4. XOR 解密处理
5. 转换回字符串: "Hello Blockchain"
```

### 安全性说明

⚠️ **重要提示**：

- 当前使用的是简单的 XOR 加密，仅用于学习演示
- 密钥硬编码在代码中，任何人都可以解密
- 生产环境应使用 AES、RSA 等标准加密算法
- 建议实现基于钱包签名的密钥派生

## 🌐 支持的网络

| 网络 | Chain ID | 说明 | 水龙头 |
|------|----------|------|--------|
| Ethereum Mainnet | 1 | 以太坊主网 | - |
| Sepolia Testnet | 11155111 | 推荐测试网 | [获取测试币](https://sepoliafaucet.com/) |
| Polygon Mainnet | 137 | Polygon 主网 | - |
| BSC Mainnet | 56 | 币安智能链 | - |

## 📊 数据查询对比

### Ethers.js 方式

**优点：**
- ✅ 直接从节点获取，数据实时准确
- ✅ 不依赖第三方服务
- ✅ 支持所有 EVM 链

**缺点：**
- ❌ 查询速度较慢（需遍历区块）
- ❌ 对节点压力大
- ❌ 历史数据查询受限

### The Graph 方式

**优点：**
- ✅ 查询速度快
- ✅ 支持复杂条件筛选
- ✅ 减少节点压力
- ✅ 可查询完整历史

**缺点：**
- ❌ 需要部署 Subgraph
- ❌ 数据可能有延迟
- ❌ 依赖第三方索引服务

## 🐛 常见问题

### Q1: 为什么需要 HTTP 服务器？

A: 因为使用了 ES6 模块 (`type="module"`)，浏览器的 CORS 策略要求必须通过 HTTP(S) 协议加载。

### Q2: 如何获取测试币？

A: 访问 Sepolia 水龙头：
- https://sepoliafaucet.com/
- https://faucet.sepolia.dev/

### Q3: 交易失败怎么办？

检查以下几点：
- ✅ 余额是否充足（包括 Gas 费）
- ✅ 接收地址格式是否正确
- ✅ 网络是否正确
- ✅ Gas 限制是否足够

### Q4: 为什么查不到交易历史？

可能原因：
- 该地址没有交易记录
- 交易在更早的区块（超过100个区块）
- 网络连接问题
- The Graph 服务不可用

## 🔒 安全建议

⚠️ **重要安全提示**：

1. **测试网络优先**：在主网使用前充分测试
2. **小额测试**：首次使用时发送小额测试
3. **验证地址**：仔细核对接收地址
4. **保护密钥**：永不分享私钥和助记词
5. **定期备份**：备份钱包和重要数据

## 📚 相关资源

- [Ethers.js v6 文档](https://docs.ethers.org/v6/)
- [The Graph 文档](https://thegraph.com/docs/)
- [MetaMask 文档](https://docs.metamask.io/)
- [以太坊开发](https://ethereum.org/developers)

## 📄 License

MIT License - 仅供学习使用

---

**最后更新**: 2025-11-16
