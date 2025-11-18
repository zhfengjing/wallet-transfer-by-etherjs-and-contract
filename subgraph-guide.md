部署 Subgraph 的完整步骤

  1️⃣ 准备工作

  首先安装 Graph CLI：
  npm install -g @graphprotocol/graph-cli
  # 或
  yarn global add @graphprotocol/graph-cli

  2️⃣ 初始化 Subgraph 项目

  # 方式一：从合约地址初始化
  graph init --studio <subgraph-name>

  # 方式二：从现有合约
  graph init --from-contract <合约地址> \
    --network sepolia \
    --contract-name <合约名称> \
    <subgraph-name>

  3️⃣ 登录 The Graph Studio

  访问 https://thegraph.com/studio/ 并连接钱包：

  1. 访问 https://thegraph.com/studio/
  2. 点击 "Connect Wallet" 连接你的钱包
  3. 创建一个新的 Subgraph
  4. 记录下你的 Deploy Key 和 Subgraph Slug

  4️⃣ 认证（Authentication）

  # 使用 Studio 提供的 deploy key
  graph auth --studio <DEPLOY_KEY>

  获取 Deploy Key 的位置：
  - 在 The Graph Studio 中，创建或打开你的 subgraph
  - 页面右上角会显示你的 deploy key
  - 通常格式类似：a1b2c3d4e5f6...

  5️⃣ 配置 Subgraph

  编辑 subgraph.yaml 文件：

  specVersion: 0.0.5
  schema:
    file: ./schema.graphql
  dataSources:
    - kind: ethereum
      name: YourContract
      network: sepolia  # 使用 sepolia 测试网
      source:
        address: "0x你的合约地址"
        abi: YourContract
        startBlock: 起始区块号  # 合约部署的区块号
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.7
        language: wasm/assemblyscript
        entities:
          - Transfer
        abis:
          - name: YourContract
            file: ./abis/YourContract.json
        eventHandlers:
          - event: Transfer(indexed address,indexed address,uint256)
            handler: handleTransfer
        file: ./src/mapping.ts

  6️⃣ 生成代码

  # 根据 ABI 和 schema 生成 TypeScript 类型
  graph codegen

  # 编译 subgraph
  graph build

  7️⃣ 部署到 Studio

  # 部署到 The Graph Studio
  graph deploy --studio <subgraph-slug>

  参数说明：
  - <subgraph-slug>: 在 Studio 中创建 subgraph 时设置的名称

  8️⃣ 发布到去中心化网络（可选）

  # 发布到 The Graph 去中心化网络需要支付 GRT
  graph publish --studio <subgraph-slug>

  ---
  📌 获取 Subgraph ID 和 Name

  方法 1: 从 The Graph Studio 获取

  1. 登录 https://thegraph.com/studio/
  2. 点击你的 subgraph
  3. 在页面中可以看到：
    - Subgraph Name/Slug: 在顶部显示
    - Subgraph ID: 在 "Details" 标签中
    - Query URL: 通常格式为：
    https://api.studio.thegraph.com/query/<deployment-id>/<subgraph-name>/<version>

  方法 2: 从部署输出获取

  部署成功后，终端会显示：
  ✔ Version Label (e.g. v0.0.1) · v0.0.1
    Skip migration: Bump mapping apiVersion from 0.0.1 to 0.0.2
    Skip migration: Bump mapping apiVersion from 0.0.2 to 0.0.3
    Skip migration: Bump mapping apiVersion from 0.0.3 to 0.0.4
    Skip migration: Bump mapping apiVersion from 0.0.4 to 0.0.5
    Skip migration: Bump mapping specVersion from 0.0.1 to 0.0.2
  ✔ Apply migrations
  ✔ Load subgraph from subgraph.yaml
    Compile data source: YourContract => build/YourContract/YourContract.wasm
  ✔ Compile subgraph
    Copy schema file build/schema.graphql
    Write subgraph file build/YourContract/abis/YourContract.json
    Write subgraph manifest build/subgraph.yaml
  ✔ Write compiled subgraph to build/
    Add file to IPFS build/schema.graphql
                  .. QmHash1...
    Add file to IPFS build/YourContract/abis/YourContract.json
                  .. QmHash2...
    Add file to IPFS build/YourContract/YourContract.wasm
                  .. QmHash3...
  ✔ Upload subgraph to IPFS

  Build completed: QmYourSubgraphHash...

  Deployed to https://thegraph.com/studio/subgraph/<your-subgraph-name>

  Subgraph endpoints:
  Queries (HTTP):     https://api.studio.thegraph.com/query/<id>/<name>/<version>

  方法 3: 查看 package.json 或项目配置

  如果项目已配置，可能在 package.json 中有脚本：
  {
    "scripts": {
      "deploy": "graph deploy --studio your-subgraph-name"
    }
  }

  ---
  🔍 验证部署状态

  部署后，在 Studio 中可以查看：
  - 同步状态: 是否已同步到最新区块
  - 索引错误: 是否有错误需要修复
  - 查询测试: 在 Playground 中测试 GraphQL 查询

  ---
  📝 常见问题

  1. 状态码 200 但返回 "Not found"

  可能原因：
  - Subgraph 还在同步中
  - 链上没有触发任何事件
  - 查询的实体不存在

  2. 如何查看同步进度

  在 The Graph Studio 的 subgraph 页面中查看 "Indexing Status"

  3. Sepolia 网络配置

  确保 subgraph.yaml 中 network 字段设置为 sepolia


  graph codegen
  Failed to load subgraph from subgraph.yaml: Error in subgraph.yaml:

  Path: dataSources > 0 > eventHandlers > 0
  Event with signature 'Transfer(indexed address,indexed address,uint256)' not present in ABI 'WalletTransfer'.
  Available events:
  - Deposit(indexed address,uint256,uint256,uint256)
  - OwnershipTransferred(indexed address,indexed address)
  - Transfer(indexed address,indexed address,uint256,uint256)
  - Withdrawal(indexed address,uint256,uint256,uint256)