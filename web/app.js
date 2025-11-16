import { BrowserProvider, parseEther, formatEther, isAddress } from 'https://cdn.jsdelivr.net/npm/ethers@6.13.0/+esm';
import { CryptoUtils } from './crypto.js';
import { TheGraphService } from './thegraph.js';

class WalletApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.crypto = new CryptoUtils();
        this.graphService = new TheGraphService();
        this.currentNetwork = null;
        this.initEventListeners();
        this.checkConnection();
    }

    initEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connectWallet());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnectWallet());
        document.getElementById('networkSwitch').addEventListener('change', (e) => this.switchNetwork(e.target.value));
        document.getElementById('sendBtn').addEventListener('click', () => this.sendTransaction());
        document.getElementById('fetchEthersBtn').addEventListener('click', () => this.fetchTransactionsEthers());
        document.getElementById('fetchGraphBtn').addEventListener('click', () => this.fetchTransactionsGraph());
        document.getElementById('encryptBtn').addEventListener('click', () => this.encryptText());
        document.getElementById('decryptBtn').addEventListener('click', () => this.decryptText());
        document.getElementById('copyAddressBtn').addEventListener('click', () => this.copyAddress());
    }

    async checkConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.connectWallet();
                }
            } catch (error) {
                console.error('检查连接失败:', error);
            }
        }
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                alert('请先安装 MetaMask!');
                window.open('https://metamask.io/download/', '_blank');
                return;
            }

            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            this.provider = new BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();

            await this.updateWalletInfo();
            this.setupEventListeners();
            this.showWalletConnected();
            
            this.showStatus('success', '✅ 钱包连接成功!');
        } catch (error) {
            console.error('连接钱包失败:', error);
            this.showStatus('error', '❌ 连接失败: ' + error.message);
        }
    }

    async updateWalletInfo() {
        const balance = await this.provider.getBalance(this.userAddress);
        const balanceInEth = formatEther(balance);
        const network = await this.provider.getNetwork();
        this.currentNetwork = network;

        // 更新右上角钱包信息
        const shortAddress = `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}`;
        document.getElementById('walletAddress').textContent = shortAddress;
        document.getElementById('walletAddress').title = this.userAddress;
        document.getElementById('currentNetwork').textContent = this.getNetworkName(Number(network.chainId));
        
        // 更新详细信息
        document.getElementById('fullAddress').textContent = this.userAddress;
        document.getElementById('balance').textContent = parseFloat(balanceInEth).toFixed(6);
        document.getElementById('networkName').textContent = this.getNetworkName(Number(network.chainId));
        document.getElementById('chainId').textContent = network.chainId.toString();
        
        // 更新网络选择器
        document.getElementById('networkSwitch').value = network.chainId.toString();
        
        document.getElementById('walletInfo').style.display = 'block';
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('fetchEthersBtn').disabled = false;
        document.getElementById('fetchGraphBtn').disabled = false;
    }

    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            5: 'Goerli Testnet',
            11155111: 'Sepolia Testnet',
            137: 'Polygon Mainnet',
            80001: 'Mumbai Testnet',
            56: 'BSC Mainnet',
            97: 'BSC Testnet'
        };
        return networks[chainId] || `Chain ${chainId}`;
    }

    setupEventListeners() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnectWallet();
            } else {
                window.location.reload();
            }
        });

        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }

    showWalletConnected() {
        document.getElementById('walletSection').style.display = 'flex';
        document.getElementById('connectBtn').style.display = 'none';
    }

    async switchNetwork(chainId) {
        if (!chainId) return;
        
        const networks = {
            '1': { chainId: '0x1', chainName: 'Ethereum Mainnet', rpcUrls: ['https://eth.llamarpc.com'], nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 } },
            '11155111': { chainId: '0xaa36a7', chainName: 'Sepolia Testnet', rpcUrls: ['https://rpc.sepolia.org'], nativeCurrency: { name: 'SepoliaETH', symbol: 'SEP', decimals: 18 } },
            '137': { chainId: '0x89', chainName: 'Polygon Mainnet', rpcUrls: ['https://polygon-rpc.com'], nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } },
            '56': { chainId: '0x38', chainName: 'BSC Mainnet', rpcUrls: ['https://bsc-dataseed.binance.org'], nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 } }
        };

        const network = networks[chainId];
        if (!network) return;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [network],
                    });
                } catch (addError) {
                    console.error('添加网络失败:', addError);
                    this.showStatus('error', '❌ 添加网络失败');
                }
            } else {
                console.error('切换网络失败:', switchError);
                this.showStatus('error', '❌ 切换网络失败');
            }
        }
    }

    disconnectWallet() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.currentNetwork = null;
        
        document.getElementById('walletSection').style.display = 'none';
        document.getElementById('connectBtn').style.display = 'inline-block';
        document.getElementById('walletInfo').style.display = 'none';
        document.getElementById('sendBtn').disabled = true;
        document.getElementById('fetchEthersBtn').disabled = true;
        document.getElementById('fetchGraphBtn').disabled = true;
        document.getElementById('txHistory').innerHTML = '';
        
        this.showStatus('success', '已断开钱包连接');
    }

    async sendTransaction() {
        const recipient = document.getElementById('recipientAddress').value.trim();
        const amount = document.getElementById('amount').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!isAddress(recipient)) {
            this.showStatus('error', '❌ 请输入有效的以太坊地址');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            this.showStatus('error', '❌ 请输入有效的转账金额');
            return;
        }

        try {
            this.showStatus('loading', '⏳ 正在处理交易...');

            const encryptedMessage = message ? this.crypto.encrypt(message) : '';
            
            const tx = {
                to: recipient,
                value: parseEther(amount),
                data: encryptedMessage ? '0x' + encryptedMessage : '0x'
            };

            const transaction = await this.signer.sendTransaction(tx);
            
            this.showStatus('loading', `⏳ 交易已提交，等待确认...\nTxHash: ${transaction.hash}`);

            const receipt = await transaction.wait();
            console.log('交易已确认:', receipt);
            this.showStatus('success', 
                `✅ 交易成功!\n` +
                `TxHash: ${receipt.hash}\n` +
                `BlockHash: ${receipt.blockHash}\n` +
                `BlockNumber: ${receipt.blockNumber}\n` +
                `Index: ${receipt.index }\n` +
                `Gas Used: ${receipt.gasUsed.toString()}\n` +
                `${message ? '✉️ 原始消息: "' + message + '"\n🔐 加密数据: ' + encryptedMessage : ''}`
            );
            this.currentBlockNumber = receipt.blockNumber;
            await this.updateWalletInfo();
            
            document.getElementById('recipientAddress').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('message').value = '';

        } catch (error) {
            console.error('交易失败:', error);
            this.showStatus('error', '❌ 交易失败: ' + (error.reason || error.message));
        }
    }

    async fetchTransactionsEthers() {
        try {
            this.showStatus('loading', '⏳ 使用 Ethers.js 获取交易历史...');
            document.getElementById('dataSource').textContent = 'Ethers.js v6';
            document.getElementById('ethersMethod').classList.add('method-card-active');
            document.getElementById('graphMethod').classList.remove('method-card-active');

            // const currentBlock = await this.provider.getBlockNumber();
            const currentBlock = this.currentBlockNumber;
            console.log('当前交易的区块号:', currentBlock);
            const history = await this.getTransactionsFromBlocks(currentBlock);

            this.displayTransactions(history);
            this.showStatus('success', `✅ 通过 Ethers.js 获取了 ${history.length} 条交易记录`);

        } catch (error) {
            console.error('获取交易失败:', error);
            this.showStatus('error', '❌ 获取交易失败: ' + error.message);
        }
    }

    async fetchTransactionsGraph() {
        try {
            this.showStatus('loading', '⏳ 使用 The Graph 获取交易历史...');
            document.getElementById('dataSource').textContent = 'The Graph';
            document.getElementById('ethersMethod').classList.remove('method-card-active');
            document.getElementById('graphMethod').classList.add('method-card-active');

            const chainId = Number(this.currentNetwork.chainId);
            const history = await this.graphService.getTransactions(this.userAddress, chainId);

            this.displayTransactions(history);
            this.showStatus('success', `✅ 通过 The Graph 获取了 ${history.length} 条交易记录`);

        } catch (error) {
            console.error('获取交易失败:', error);
            this.showStatus('error', '❌ The Graph 查询失败: ' + error.message);
        }
    }

    async getTransactionsFromBlocks(currentBlock) {
        const transactions = [];
        const startBlock = Math.max(0, currentBlock - 1);

        for (let i = currentBlock; i >= startBlock && transactions.length < 10; i--) {
            try {
                const block = await this.provider.getBlock(i, true);
                
                if (!block || !block.transactions) continue;

                for (const txHash of block.transactions) {
                    const tx = typeof txHash === 'string' ? await this.provider.getTransaction(txHash) : txHash;
                    // console.log('检查交易:', tx);
                    if (tx && (tx.from.toLowerCase() === this.userAddress.toLowerCase() ||
                        tx.to?.toLowerCase() === this.userAddress.toLowerCase())) {
                        
                        const receipt = await this.provider.getTransactionReceipt(tx.hash);
                        
                        transactions.push({
                            hash: tx.hash,
                            from: tx.from,
                            to: tx.to,
                            value: formatEther(tx.value),
                            data: tx.data,
                            blockNumber: tx.blockNumber,
                            timestamp: block.timestamp,
                            status: receipt.status === 1 ? 'Success' : 'Failed',
                            gasUsed: receipt.gasUsed.toString()
                        });

                        if (transactions.length >= 10) break;
                    }
                }
            } catch (error) {
                console.error(`获取区块 ${i} 失败:`, error);
            }
        }

        return transactions;
    }

    displayTransactions(transactions) {
        const container = document.getElementById('txHistory');
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="no-data"><p>📭 暂无交易记录</p></div>';
            return;
        }

        container.innerHTML = transactions.map(tx => {
            const type = tx.from.toLowerCase() === this.userAddress.toLowerCase() ? '发送' : '接收';
            const typeClass = type === '发送' ? 'sent' : 'received';
            let decryptedMessage = '';
            
            if (tx.data && tx.data !== '0x' && tx.data.length > 2) {
                try {
                    const hexData = tx.data.substring(2);
                    decryptedMessage = this.crypto.decrypt(hexData);
                } catch (error) {
                    decryptedMessage = null;
                }
            }

            const date = tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString('zh-CN') : 'N/A';

            return `
                <div class="tx-item ${typeClass}">
                    <div class="tx-header">
                        <span class="tx-type-badge ${typeClass}">${type}</span>
                        <span class="tx-date">${date}</span>
                    </div>
                    <div class="tx-details">
                        <div class="tx-row">
                            <strong>哈希:</strong>
                            <a href="https://etherscan.io/tx/${tx.hash}" target="_blank" class="tx-hash">${tx.hash}</a>
                        </div>
                        <div class="tx-row">
                            <strong>From:</strong>
                            <span class="address">${tx.from}</span>
                        </div>
                        <div class="tx-row">
                            <strong>To:</strong>
                            <span class="address">${tx.to || 'Contract Creation'}</span>
                        </div>
                        <div class="tx-row">
                            <strong>金额:</strong>
                            <span class="amount">${parseFloat(tx.value).toFixed(6)} ETH</span>
                        </div>
                        <div class="tx-row">
                            <strong>状态:</strong>
                            <span class="status ${tx.status === 'Success' ? 'success' : 'failed'}">${tx.status}</span>
                        </div>
                         <div class="tx-row">
                            <strong>区块号:</strong>
                            <span class="blocknumber">${tx.blockNumber}</span>
                        </div>
                        ${tx.gasUsed ? `<div class="tx-row"><strong>Gas:</strong> ${tx.gasUsed}</div>` : ''}
                        ${decryptedMessage ? `
                            <div class="tx-row">
                                <strong>📨 交易备注:</strong>
                                <span class="blocknumber">${decryptedMessage}</span>
                            </div>
                            <div class="tx-row">
                                <strong>🔐 交易备注加密数据:</strong>
                                <div class="encrypted-data">${tx.data}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    copyAddress() {
        navigator.clipboard.writeText(this.userAddress).then(() => {
            const btn = document.getElementById('copyAddressBtn');
            const originalText = btn.textContent;
            btn.textContent = '✓ 已复制';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    encryptText() {
        const plainText = document.getElementById('plainText').value.trim();
        if (!plainText) {
            alert('请输入要加密的文本');
            return;
        }

        const encrypted = this.crypto.encrypt(plainText);
        document.getElementById('encryptedText').value = encrypted;
    }

    decryptText() {
        const hexText = document.getElementById('hexToDecrypt').value.trim();
        if (!hexText) {
            alert('请输入要解密的16进制文本');
            return;
        }

        try {
            const decrypted = this.crypto.decrypt(hexText);
            document.getElementById('decryptedText').value = decrypted;
        } catch (error) {
            alert('解密失败: ' + error.message);
        }
    }

    showStatus(type, message) {
        const statusBox = document.getElementById('txStatus');
        statusBox.className = 'status-box ' + type;
        statusBox.innerHTML = message.replace(/\n/g, '<br>');
    }
}

const app = new WalletApp();
