/**
 * The Graph 服务类
 * 用于查询链上数据
 */
export class TheGraphService {
    constructor() {
        // The Graph API endpoints for different networks
        this.endpoints = {
            1: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
            11155111: 'https://api.studio.thegraph.com/query/sepolia/blocks',
            137: 'https://api.thegraph.com/subgraphs/name/matthewlilley/polygon-blocks'
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
            return this.getMockTransactions(address);
        }

        try {
            // 实际的 GraphQL 查询示例
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
                throw new Error('GraphQL query failed');
            }

            // 转换数据格式
            return this.formatTransactions(result.data?.transactions || []);
            
        } catch (error) {
            console.error('The Graph query failed:', error);
            // 查询失败时返回模拟数据
            return this.getMockTransactions(address);
        }
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
        return (parseInt(wei) / 1e18).toString();
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
