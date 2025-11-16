# 快速使用指南

## 🎯 5分钟快速上手

### 第一步：启动服务器

```bash
cd /Users/scenery/Desktop/project/web3_housework/my_web3_assignment/wallet-transfer-etherjs

# 使用 Python
python3 -m http.server 8000
```

访问: http://localhost:8000

### 第二步：连接钱包

1. 点击右上角 **"连接 MetaMask"** 按钮
2. 在弹出的 MetaMask 窗口中选择账户
3. 点击 **"连接"** 确认

### 第三步：切换到测试网络

1. 点击右上角的网络选择器
2. 选择 **"Sepolia Testnet"**
3. 在 MetaMask 中确认切换

### 第四步：获取测试币

访问 Sepolia 水龙头获取免费测试币：
- https://sepoliafaucet.com/
- https://faucet.sepolia.dev/

### 第五步：发送加密转账

1. **接收地址**: 输入一个以太坊地址
2. **转账金额**: 输入金额，例如 `0.01`
3. **消息**: 输入 `Hello Blockchain!`（这会被加密）
4. 点击 **"发送交易"**
5. 在 MetaMask 中确认交易
6. 等待确认（约15-30秒）

### 第六步：查看交易历史

#### 使用 Ethers.js 查询
- 点击 **"使用 Ethers.js 查询"** 按钮
- 等待查询完成
- 查看解密后的消息

#### 使用 The Graph 查询
- 点击 **"使用 The Graph 查询"** 按钮
- 查看模拟的交易数据（包含解密消息）

## 💡 功能特色

### 1. 右上角网络切换
- 支持 4 个主流网络
- 一键切换，自动刷新
- 实时显示当前网络

### 2. 双重数据源
- **Ethers.js v6**: 直接从区块链查询
- **The Graph**: GraphQL 查询（演示模式）

### 3. 加密转账
- 消息自动加密为16进制
- 存储在交易 data 字段
- 读取时自动解密显示

### 4. 独立加密工具
- 测试加密算法
- 验证加密解密流程
- 支持任意文本

## ⚠️ 注意事项

1. ✅ **仅在测试网测试**
2. ✅ **不要分享私钥**
3. ✅ **验证接收地址**
4. ✅ **从小额开始**

## 📖 项目文件

- `index.html` - 主页面
- `app.js` - 应用逻辑（Ethers.js v6）
- `crypto.js` - 加密工具
- `thegraph.js` - The Graph 服务
- `styles.css` - 样式文件
- `README.md` - 完整文档

---

祝你使用愉快！🚀
