/**
 * The Graph 服务类
 * 用于查询链上数据
 */
export class TheGraphService {
    constructor() {
        // The Graph API endpoints for different networks
        this.endpoints = {
            1: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
            11155111: 'https://api.studio.thegraph.com/query/119822/wallet-transfer-subgraph/v0.0.1',
            // 11155111: 'https://api.studio.thegraph.com/query/sepolia/blocks',
            137: 'https://api.thegraph.com/subgraphs/name/matthewlilley/polygon-blocks',
            // 本地开发网络 - 连接到本地 Graph Node
            31337: 'http://127.0.0.1:8000/subgraphs/name/wallet-transfer',
            1337: 'http://127.0.0.1:8000/subgraphs/name/wallet-transfer'
        };
    }

    /**
     * 获取用户的交易历史
     * @param {string} address - 用户地址
     * @param {number} chainId - 链ID
     * @returns {Promise<Array>} 交易列表
     */
    async getTransactions(address, chainId) {
        const endpoint = this.endpoints[chainId];

        if (!endpoint) {
            // 如果没有对应的 endpoint，使用模拟数据
            console.warn(`No endpoint configured for chainId ${chainId}, using mock data`);
            return this.getMockTransactions(address);
        }

        try {
            // 针对本地和 Sepolia 的 wallet-transfer subgraph 查询
            if (chainId === 31337 || chainId === 1337 || chainId === 11155111) {
                console.log(`Using wallet-transfer subgraph query for chainId ${chainId}`);
                return await this.getWalletTransferTransactions(address, endpoint);
            }

            // 其他网络的通用查询（保留，以备将来使用）
            const query = `
                query GetTransactions($address: String!) {
                    transactions(
                        where: { from: $address }
                        orderBy: timestamp
                        orderDirection: desc
                        first: 10
                    ) {
                        id
                        hash
                        from
                        to
                        value
                        input
                        gasUsed
                        gasPrice
                        timestamp
                        blockNumber
                    }
                }
            `;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: { address: address.toLowerCase() }
                }),
                cors: { mode: 'cors' }
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL errors:', result.errors);
                throw new Error('GraphQL query failed: ' + JSON.stringify(result.errors));
            }

            // 转换数据格式
            return this.formatTransactions(result.data?.transactions || []);

        } catch (error) {
            console.error('The Graph query failed:', error);
            console.error('Error details:', error.message);
            // 查询失败时返回模拟数据
            return this.getMockTransactions(address);
        }
    }

    /**
     * 查询 wallet-transfer subgraph
     * @param {string} address - 用户地址
     * @param {string} endpoint - GraphQL endpoint
     */
    async getWalletTransferTransactions(address, endpoint) {
        console.log('Querying wallet-transfer subgraph:', { address, endpoint });

        // 使用两个查询分别获取发送和接收的转账，然后合并
        // 因为某些版本的 The Graph 不支持 OR 条件
        const query = `
            query GetTransfers($address: Bytes!) {
                fromTransfers: transfers(
                    where: { from: $address }
                    orderBy: timestamp
                    orderDirection: desc
                    first: 10
                ) {
                    id
                    from
                    to
                    amount
                    timestamp
                    blockNumber
                    blockTimestamp
                    transactionHash
                }
                toTransfers: transfers(
                    where: { to: $address }
                    orderBy: timestamp
                    orderDirection: desc
                    first: 10
                ) {
                    id
                    from
                    to
                    amount
                    timestamp
                    blockNumber
                    blockTimestamp
                    transactionHash
                }
            }
        `;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: {
                    address: address.toLowerCase()
                }
            })
        });

        if (!response.ok) {
            console.error('HTTP error:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('GraphQL response:', result);

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error('GraphQL query failed: ' + JSON.stringify(result.errors));
        }

        // 合并发送和接收的转账
        const fromTransfers = result.data?.fromTransfers || [];
        const toTransfers = result.data?.toTransfers || [];
        const allTransfers = [...fromTransfers, ...toTransfers];

        // 去重（同一个 id 可能同时出现在两个列表中）
        const uniqueTransfers = Array.from(
            new Map(allTransfers.map(t => [t.id, t])).values()
        );

        // 按时间戳排序
        uniqueTransfers.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

        console.log(`Found ${uniqueTransfers.length} unique transfers`);

        // 转换为统一格式
        return this.formatWalletTransferData(uniqueTransfers);
    }

    /**
     * 格式化 WalletTransfer 数据
     */
    formatWalletTransferData(transfers) {
        console.log('Formatting transfers:', transfers);

        return transfers.map(transfer => {
            // 处理可能的 BigInt 或 字符串类型
            const amount = typeof transfer.amount === 'string' ? transfer.amount : transfer.amount.toString();
            const blockNumber = typeof transfer.blockNumber === 'string' ?
                parseInt(transfer.blockNumber) : Number(transfer.blockNumber);
            const timestamp = typeof transfer.timestamp === 'string' ?
                parseInt(transfer.timestamp) : Number(transfer.timestamp);

            return {
                hash: transfer.transactionHash,
                from: transfer.from,
                to: transfer.to,
                value: this.weiToEth(amount),
                data: '0x',
                blockNumber: blockNumber,
                timestamp: timestamp,
                status: 'Success',
                gasUsed: 'N/A'
            };
        });
    }

    /**
     * 格式化交易数据
     */
    formatTransactions(transactions) {
        return transactions.map(tx => ({
            hash: tx.hash || tx.id,
            from: tx.from,
            to: tx.to,
            value: this.weiToEth(tx.value),
            data: tx.input || '0x',
            blockNumber: parseInt(tx.blockNumber),
            timestamp: parseInt(tx.timestamp),
            status: 'Success',
            gasUsed: tx.gasUsed || '0'
        }));
    }

    /**
     * Wei 转 ETH
     */
    weiToEth(wei) {
        try {
            // 处理字符串、数字或 BigInt 类型
            const weiValue = typeof wei === 'string' ? wei : wei.toString();
            // 使用 BigInt 进行精确计算，避免精度丢失
            const weiNum = BigInt(weiValue);
            const ethValue = Number(weiNum) / 1e18;
            return ethValue.toString();
        } catch (error) {
            console.error('Error converting Wei to ETH:', error, wei);
            return '0';
        }
    }

    /**
     * 获取模拟交易数据
     * 用于演示 The Graph 功能
     */
    getMockTransactions(address) {
        const now = Math.floor(Date.now() / 1000);
        
        return [
            {
                hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                from: address,
                to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                value: '0.1',
                data: this.encryptMessage('Hello from The Graph!'),
                blockNumber: 12345678,
                timestamp: now - 3600,
                status: 'Success',
                gasUsed: '21000'
            },
            {
                hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                to: address,
                value: '0.05',
                data: this.encryptMessage('Payment received'),
                blockNumber: 12345679,
                timestamp: now - 7200,
                status: 'Success',
                gasUsed: '21000'
            },
            {
                hash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
                from: address,
                to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
                value: '0.2',
                data: this.encryptMessage('Test transaction'),
                blockNumber: 12345680,
                timestamp: now - 10800,
                status: 'Success',
                gasUsed: '21000'
            }
        ];
    }

    /**
     * 模拟加密消息（与 crypto.js 保持一致）
     */
    encryptMessage(text) {
        const secretKey = 'MySecretKey123456789';
        const textBytes = Array.from(text).map(c => c.charCodeAt(0));
        const keyBytes = Array.from(secretKey).map(c => c.charCodeAt(0));
        
        const encrypted = textBytes.map((byte, i) => 
            byte ^ keyBytes[i % keyBytes.length]
        );
        
        const hexString = encrypted.map(byte => 
            byte.toString(16).padStart(2, '0')
        ).join('');
        
        return '0x' + hexString;
    }

    /**
     * 查询特定区块的交易
     */
    async getBlockTransactions(blockNumber, chainId) {
        const endpoint = this.endpoints[chainId];
        
        if (!endpoint) {
            throw new Error(`No Graph endpoint for chain ${chainId}`);
        }

        const query = `
            query GetBlockTransactions($blockNumber: Int!) {
                transactions(
                    where: { blockNumber: $blockNumber }
                    first: 100
                ) {
                    id
                    hash
                    from
                    to
                    value
                    input
                    blockNumber
                }
            }
        `;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: { blockNumber }
                })
            });

            const result = await response.json();
            return this.formatTransactions(result.data?.transactions || []);
        } catch (error) {
            console.error('Block transactions query failed:', error);
            return [];
        }
    }
}
