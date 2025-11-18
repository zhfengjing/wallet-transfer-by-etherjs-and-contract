import { Contract, parseEther, formatEther } from 'https://cdn.jsdelivr.net/npm/ethers@6.13.0/+esm';
// import { contractData } from './contractAbi.js';//使用js方式引入
// 使用json方式引入（新，旧两种方式，需要浏览器支持）
import contractData from './contractAbi.json' with { type: 'json' };//新语法，需要浏览器支持 JSON 模块（Chrome 91+, Firefox 89+）
// import contractData from './contractAbi.json' assert { type: 'json' }; //旧语法，需要浏览器支持 JSON 模块（Chrome 91+, Firefox 89+）
console.log('Loaded contract  data:', contractData);
/**
 * WalletTransfer Contract Service
 * 处理与 WalletTransfer 合约的所有交互
 */
export class ContractService {
    constructor() {
        // 合约地址 - 从 subgraph.yaml 中获取
        this.contractAddress = contractData.address;

        // WalletTransfer 合约 ABI
        this.contractABI = [
            {
                "inputs": [],
                "name": "deposit",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "transfer",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "withdraw",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                    }
                ],
                "name": "getBalance",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getContractBalance",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newBalance",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "name": "Deposit",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "name": "Transfer",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newBalance",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "name": "Withdrawal",
                "type": "event"
            }
        ];

        this.contract = null;
    }

    /**
     * 初始化合约实例
     * @param {*} signer - Ethers.js signer
     */
    initialize(signer) {
        const { address, abi } = contractData;
        this.contract = new Contract(address, abi, signer);
        this.contract.on('Transfer', (from, to, amount, timestamp, event) => {
            console.log(`Transfer Event - From: ${from}, To: ${to}, Amount: ${formatEther(amount)}, Timestamp: ${new Date(timestamp.toNumber() * 1000).toLocaleString()}`);
        });
    }
    /**
     * 移除所有事件监听器
     */
    removeAllListeners() {
        if (this.contract) {
            this.contract.removeAllListeners('Transfer');
        }
    }

    /**
     * 向合约存入 ETH
     * @param {string} amount - 存入金额（ETH）
     */
    async deposit(amount) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        const tx = await this.contract.deposit({
            value: parseEther(amount)
        });

        return tx;
    }

    /**
     * 通过合约转账
     * @param {string} to - 接收地址
     * @param {string} amount - 转账金额（ETH）
     */
    async transfer(to, amount) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        const tx = await this.contract.transfer(to, parseEther(amount));
        return tx;
    }

    /**
     * 从合约提取 ETH
     * @param {string} amount - 提取金额（ETH）
     */
    async withdraw(amount) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        const tx = await this.contract.withdraw(parseEther(amount));
        return tx;
    }

    /**
     * 获取用户在合约中的余额
     * @param {string} address - 用户地址
     */
    async getBalance(address) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        const balance = await this.contract.getBalance(address);
        return formatEther(balance);
    }

    /**
     * 获取合约的总余额
     */
    async getContractBalance() {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        const balance = await this.contract.getContractBalance();
        return formatEther(balance);
    }
}
