# Subgraph 部署指南

## 📋 前置要求

- ✅ Docker 和 Docker Compose 已安装
- ✅ 本地区块链节点运行中（Hardhat Node / Ganache）
- ✅ 合约已部署

---

## 🚀 本地部署步骤

### 步骤 1：启动本地 Graph Node 环境

```bash
# 启动 Graph Node、IPFS 和 PostgreSQL
docker-compose up -d

# 查看日志（可选）
docker-compose logs -f graph-node
```

**服务端口**：
- GraphQL HTTP: http://localhost:8000
- GraphQL WebSocket: ws://localhost:8001
- Admin JSON-RPC: http://localhost:8020
- Indexing Status: http://localhost:8030

---

### 步骤 2：创建 Subgraph

```bash
# 创建 subgraph（只需要执行一次）
graph create --node http://localhost:8020/ wallet-transfer
```

**命令解释**：
- `graph create`: 在 Graph Node 中注册一个新的 subgraph
- `--node http://localhost:8020/`: Graph Node 的 admin API 地址
- `wallet-transfer`: subgraph 的名称（可自定义）

---

### 步骤 3：生成代码和构建

```bash
# 生成 TypeScript 类型
npm run codegen

# 构建 subgraph
npm run build
```

**命令解释**：
- `graph codegen`: 根据 ABI 和 schema 生成 TypeScript 类型
- `graph build`: 编译 AssemblyScript 代码为 WASM

---

### 步骤 4：部署 Subgraph

```bash
# 部署到本地 Graph Node
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 wallet-transfer
```

**命令详细解释**：

| 参数 | 说明 | 示例值 |
|------|------|--------|
| `graph deploy` | 部署命令 | - |
| `--node` | Graph Node 的 admin API 地址 | `http://localhost:8020/` |
| `--ipfs` | IPFS 节点地址（用于上传构建文件） | `http://localhost:5001` |
| `wallet-transfer` | Subgraph 名称（必须与创建时一致） | `wallet-transfer` |

**可选参数**：
- `--version-label v0.1.0`: 为部署添加版本标签
- `--watch`: 监听文件变化并自动重新部署
- `--debug-fork <id>`: 使用远程 subgraph 的数据进行调试

---

### 步骤 5：验证部署

```bash
# 查看 subgraph 状态
curl http://localhost:8030/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ indexingStatuses { subgraph synced health } }"}'
```

访问 GraphQL Playground：
```
http://localhost:8000/subgraphs/name/wallet-transfer/graphql
```

测试查询：
```graphql
{
  transfers(first: 5) {
    id
    from
    to
    amount
    timestamp
  }
}
```

---

## 🌐 生产环境部署

### 部署到 The Graph 托管服务

#### 1. 创建账号并获取 Deploy Key

访问：https://thegraph.com/studio/

#### 2. 认证

```bash
graph auth --studio <YOUR_DEPLOY_KEY>
```

#### 3. 创建 Subgraph

在 The Graph Studio 创建新的 subgraph

#### 4. 部署

```bash
# 修改 subgraph.yaml 中的 network（如 sepolia、mainnet）
# 然后部署
graph deploy --studio <SUBGRAPH_SLUG>
```

---

## 🔄 更新 Subgraph

修改代码后重新部署：

```bash
# 1. 重新生成类型（如果修改了 schema 或 ABI）
npm run codegen

# 2. 重新构建
npm run build

# 3. 部署新版本
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 wallet-transfer --version-label v0.2.0
```

---

## 🛠️ 常用命令

| 命令 | 说明 |
|------|------|
| `graph codegen` | 生成 TypeScript 类型 |
| `graph build` | 编译 subgraph |
| `graph deploy` | 部署 subgraph |
| `graph create` | 创建 subgraph 名称 |
| `graph remove` | 删除 subgraph |
| `graph auth` | 设置部署密钥 |

---

## 📊 GraphQL 查询示例

```graphql
# 查询所有转账
{
  transfers(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    from
    to
    amount
    timestamp
    blockNumber
    transactionHash
  }
}

# 查询特定地址的转账（发送方）
{
  transfers(where: { from: "0x..." }) {
    id
    to
    amount
    timestamp
  }
}

# 查询特定地址的转账（接收方）
{
  transfers(where: { to: "0x..." }) {
    id
    from
    amount
    timestamp
  }
}

# 查询大额转账
{
  transfers(where: { amount_gt: "1000000000000000000" }) {
    id
    from
    to
    amount
  }
}
```

---

## ❌ 故障排查

### 问题 1: Graph Node 连接失败

**错误**：`Failed to deploy to Graph node`

**解决**：
```bash
# 检查 Graph Node 是否运行
docker-compose ps

# 查看日志
docker-compose logs graph-node
```

### 问题 2: 合约地址不匹配

**错误**：`No contract found at address`

**解决**：更新 `subgraph.yaml` 中的合约地址和 startBlock

### 问题 3: 同步失败

**错误**：`Failed to index block`

**解决**：
- 检查区块链节点是否可访问
- 验证合约 ABI 是否正确
- 查看 Graph Node 日志获取详细错误信息

---

## 🧹 清理环境

```bash
# 停止所有服务
docker-compose down

# 删除数据卷（会清空所有索引数据）
docker-compose down -v

# 删除 Subgraph
graph remove --node http://localhost:8020/ wallet-transfer
```

---

## 📖 参考资源

- [The Graph 官方文档](https://thegraph.com/docs/)
- [Graph CLI 文档](https://github.com/graphprotocol/graph-tooling/tree/main/packages/cli)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)
