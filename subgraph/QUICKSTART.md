# 🚀 快速开始指南

## 一、准备工作

### 1. 确保本地区块链节点运行
```bash
# 在 contract 目录下启动 Hardhat 节点
npx hardhat node
```

### 2. 部署合约并记录地址
```bash
# 部署合约后，记录合约地址和部署区块号
npx hardhat run scripts/deploy.js --network localhost
```

### 3. 更新 subgraph.yaml
```yaml
dataSources:
  - kind: ethereum
    name: WalletTransfer
    network: localhost
    source:
      address: "0x5FbDB2315678afecb367f032d93F642f64180aa3"  # ← 替换为你的合约地址
      abi: WalletTransfer
      startBlock: 1  # ← 替换为部署区块号
```

---

## 二、本地部署（5 步完成）

### 步骤 1️⃣：启动 Graph Node 环境
```bash
npm run docker:up
```

等待所有服务启动（约 30 秒）。可以用以下命令查看日志：
```bash
npm run docker:logs
```

---

### 步骤 2️⃣：创建 Subgraph
```bash
npm run create:local
```

**输出示例**：
```
Created subgraph: wallet-transfer
```

> ⚠️ 注意：此命令只需执行一次。如果报错 "subgraph already exists"，可以跳过此步骤。

---

### 步骤 3️⃣：生成类型
```bash
nnpm run codege
```

**输出示例**：
```
✔ Generate types for contract ABIs
✔ Generate types for GraphQL schema
```

---

### 步骤 4️⃣：构建 Subgraph
```bash
npm run build
```

**输出示例**：
```
✔ Compile subgraph
✔ Write compiled subgraph to build/
```

---

### 步骤 5️⃣：部署到本地 Graph Node
```bash
npm run deploy:local
```

**输出示例**：
```
Deployed to http://localhost:8000/subgraphs/name/wallet-transfer/graphql
```

---

## 三、验证部署

### 1. 访问 GraphQL Playground
打开浏览器访问：
```
http://localhost:8000/subgraphs/name/wallet-transfer/graphql
```

### 2. 测试查询
在 GraphQL Playground 中执行：
```graphql
{
  transfers(first: 5, orderBy: timestamp, orderDirection: desc) {
    id
    from
    to
    amount
    timestamp
    blockNumber
    transactionHash
  }
}
```

### 3. 检查索引状态
```bash
npm run test:query
```

**成功示例**：
```json
{
  "data": {
    "indexingStatuses": [{
      "subgraph": "wallet-transfer",
      "synced": true,
      "health": "healthy"
    }]
  }
}
```

---

## 四、触发事件并查看数据

### 1. 执行合约交易
在另一个终端执行转账操作（触发 Transfer 事件）

### 2. 等待索引（约 5-10 秒）

### 3. 再次查询 GraphQL
```graphql
{
  transfers {
    id
    from
    to
    amount
    timestamp
  }
}
```

你应该能看到新的转账记录！

---

## 五、常用命令速查

| 命令 | 说明 |
|------|------|
| `npm run docker:up` | 启动 Graph Node 环境 |
| `npm run docker:down` | 停止 Graph Node 环境 |
| `npm run docker:logs` | 查看 Graph Node 日志 |
| `npm run create:local` | 创建 subgraph（只需一次） |
| `npm run codegen` | 生成 TypeScript 类型 |
| `npm run build` | 编译 subgraph |
| `npm run deploy:local` | 部署到本地 Graph Node |
| `npm run remove:local` | 删除 subgraph |
| `npm run test:query` | 检查索引状态 |

---

## 六、命令含义详解

### `graph deploy` 命令完整解析

```bash
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 wallet-transfer
```

**拆解说明**：

| 组成部分 | 含义 | 类比 |
|---------|------|------|
| `graph deploy` | 部署命令 | 就像 `npm publish` 发布包 |
| `--node http://localhost:8020/` | Graph Node 管理接口地址 | 告诉工具"部署到哪里" |
| `--ipfs http://localhost:5001` | IPFS 节点地址 | 文件存储位置（类似 CDN） |
| `wallet-transfer` | Subgraph 名称 | 项目名称（必须提前创建） |

**完整流程**：
```
1. graph deploy 读取 build/ 目录
2. 将编译文件上传到 IPFS
3. 通知 Graph Node 开始索引
4. Graph Node 从 IPFS 下载文件
5. 开始监听区块链事件
6. 执行 mapping.ts 中的处理逻辑
7. 将数据存入 PostgreSQL
8. 通过 GraphQL API 提供查询
```

---

## 七、故障排查

### ❌ 问题 1：`Failed to deploy to Graph node`
**原因**：Graph Node 未启动
**解决**：
```bash
npm run docker:up
```

---

### ❌ 问题 2：`Subgraph name already exists`
**原因**：Subgraph 已存在
**解决**：跳过 `create:local` 步骤，直接执行 `deploy:local`

---

### ❌ 问题 3：查询返回空数据
**原因**：
1. 合约地址或 startBlock 配置错误
2. 还没有触发事件
3. 索引尚未完成

**解决**：
```bash
# 1. 检查索引状态
npm run test:query

# 2. 查看 Graph Node 日志
npm run docker:logs

# 3. 验证合约地址
cat subgraph.yaml | grep address
```

---

## 八、重新部署

修改代码后重新部署：
```bash
# 如果修改了 schema.graphql 或 ABI
npm run codegen

# 重新构建
npm run build

# 重新部署
npm run deploy:local
```

---

## 📚 下一步

- 阅读完整部署指南：[DEPLOYMENT.md](./DEPLOYMENT.md)
- 学习 GraphQL 查询：访问 http://localhost:8000/subgraphs/name/wallet-transfer/graphql
- 优化 Schema：添加更多查询维度
- 部署到生产环境：The Graph Studio

---

**🎉 完成！现在你的 Subgraph 已经在本地运行了！**
