import { BrowserProvider, parseEther, formatEther, isAddress } from 'https://cdn.jsdelivr.net/npm/ethers@6.13.0/+esm';
import { CryptoUtils } from './crypto.js';
import { TheGraphService } from './thegraph.js';
import { ContractService } from './contract.js';
class WalletApp {
    constructor() {
        console.log('🔧 [WalletApp] 构造函数被调用');
        console.trace('调用栈:');

        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.crypto = new CryptoUtils();
        this.graphService = new TheGraphService();
        this.contractService = new ContractService();
        this.currentNetwork = null;
        this.eventListenersSetup = false; // 防止重复设置事件监听器
        this.initEventListeners();
        this.checkConnection();
    }

    initEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connectWallet());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnectWallet());
        document.getElementById('networkSwitch').addEventListener('change', (e) => this.switchNetwork(e.target.value));
        document.getElementById('sendBtn').addEventListener('click', () => this.sendTransaction());

        // 加密/解密工具（如果存在）
        const encryptBtn = document.getElementById('encryptBtn');
        if (encryptBtn) {
            encryptBtn.addEventListener('click', () => this.encryptText());
        }
        const decryptBtn = document.getElementById('decryptBtn');
        if (decryptBtn) {
            decryptBtn.addEventListener('click', () => this.decryptText());
        }

        document.getElementById('copyAddressBtn').addEventListener('click', () => this.copyAddress());

        // Tab 切换事件监听
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // 直接转账相关
        document.getElementById('fetchDirectBtn').addEventListener('click', () => this.fetchDirectTransactions());

        // 合约相关事件监听
        document.getElementById('contractDepositBtn').addEventListener('click', () => this.contractDeposit());
        document.getElementById('contractTransferBtn').addEventListener('click', () => this.contractTransfer());
        document.getElementById('contractWithdrawBtn').addEventListener('click', () => this.contractWithdraw());
        document.getElementById('refreshContractBalanceBtn').addEventListener('click', () => this.refreshContractBalance());
        document.getElementById('fetchContractBtn').addEventListener('click', () => this.fetchContractTransactions());
    }

    async checkConnection() {
        console.log('🔍 [checkConnection] 被调用');
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                console.log('   已连接账户:', accounts);
                if (accounts.length > 0) {
                    console.log('   → 调用 connectWallet()');
                    await this.connectWallet(accounts[0]);
                }
            } catch (error) {
                console.error('检查连接失败:', error);
            }
        }
    }

    async connectWallet(account) {
        console.log('🔌 [connectWallet] 被调用');
        console.trace('调用栈:');

        try {
            if (typeof window.ethereum === 'undefined') {
                alert('请先安装 MetaMask!');
                window.open('https://metamask.io/download/', '_blank');
                return;
            }
            if (!account) {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
            }

            this.provider = new BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();

            console.log('   连接的账户:', this.userAddress);

            // 初始化合约服务
            this.contractService.initialize(this.signer);

            await this.updateWalletInfo();
            await this.updateContractInfo();

            console.log('   → 调用 setupEventListeners()');
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
        document.getElementById('fetchDirectBtn').disabled = false;
        document.getElementById('fetchContractBtn').disabled = false;
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
        console.log('⚙️ [setupEventListeners] 被调用');
        console.trace('调用栈:');

        // 如果已经设置过事件监听器，直接返回
        if (this.eventListenersSetup) {
            console.log('   ⚠️ 事件监听器已设置，跳过');
            return;
        }

        // 账户变化监听器
        const accountsChangedHandler = (accounts) => {
            console.log('🔔 [accountsChanged] 触发');
            console.log('   新账户列表:', accounts);
            console.log('   当前账户:', this.userAddress);

            if (!accounts || accounts.length === 0) {
                console.log('   → 账户列表为空，断开连接');
                this.disconnectWallet();
                return;
            }

            // 检查账户是否存在
            if (!accounts[0]) {
                console.log('   → 账户地址为空，忽略此事件');
                return;
            }

            // 只有当账户真正改变时才更新UI
            const newAccount = accounts[0].toLowerCase();
            const currentAccount = this.userAddress ? this.userAddress.toLowerCase() : '';

            console.log('   比较: 新=' + newAccount + ', 当前=' + currentAccount);

            if (newAccount !== currentAccount) {
                console.log('   ❌ 账户已改变，重新加载钱包信息');
                // 不刷新页面，而是重新连接钱包
                this.userAddress = accounts[0];
                this.updateWalletInfo().catch(err => console.error('更新钱包信息失败:', err));
            } else {
                console.log('   ✅ 账户未改变，忽略');
            }
        };

        // 网络变化监听器
        const chainChangedHandler = (chainId) => {
            console.log('🔔 [chainChanged] 网络变化，Chain ID:', chainId);
            console.log('   重新加载钱包信息');
            // 不刷新页面，而是重新加载钱包信息
            this.updateWalletInfo().catch(err => console.error('更新钱包信息失败:', err));
        };

        // 添加事件监听器
        window.ethereum.on('accountsChanged', accountsChangedHandler);
        window.ethereum.on('chainChanged', chainChangedHandler);

        this.eventListenersSetup = true;
        console.log('   ✅ 事件监听器设置完成（不会自动刷新页面）');
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
        document.getElementById('fetchDirectBtn').disabled = true;
        document.getElementById('fetchContractBtn').disabled = true;
        document.getElementById('directTxHistory').innerHTML = '';
        document.getElementById('contractTxHistory').innerHTML = '';

        // 重置合约余额显示
        document.getElementById('contractUserBalance').textContent = '-';
        document.getElementById('contractTotalBalance').textContent = '-';

        this.showStatus('success', '已断开钱包连接');
        // 移除合约事件监听
        this.contractService.removeAllListeners();
    }

    async sendTransaction() {
        const recipient = document.getElementById('recipientAddress').value.trim();
        const amount = document.getElementById('amount').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!isAddress(recipient)) {
            this.showStatus('error', '❌ 请输入有效的以太坊地址');
            return;
        }

        if ((!amount && amount !== '0') || parseFloat(amount) < 0) {
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

    async fetchContractTransactions() {
        try {
            this.showContractStatus('loading', '⏳ 使用 The Graph 获取合约转账历史...');

            const chainId = Number(this.currentNetwork.chainId);
            const history = await this.graphService.getTransactions(this.userAddress, chainId);

            this.displayContractTransactions(history);
            this.showContractStatus('success', `✅ 通过 The Graph 获取了 ${history.length} 条合约转账记录`);

        } catch (error) {
            console.error('获取合约转账失败:', error);
            this.showContractStatus('error', '❌ The Graph 查询失败: ' + error.message);
        }
    }

    displayContractTransactions(transactions) {
        const container = document.getElementById('contractTxHistory');

        if (transactions.length === 0) {
            container.innerHTML = '<div class="no-data"><p>📭 暂无合约转账记录</p></div>';
            return;
        }

        container.innerHTML = transactions.map(tx => {
            const type = tx.from.toLowerCase() === this.userAddress.toLowerCase() ? '发送' : '接收';
            const typeClass = type === '发送' ? 'sent' : 'received';

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
                        ${tx.gasUsed && tx.gasUsed !== 'N/A' ? `<div class="tx-row"><strong>Gas:</strong> ${tx.gasUsed}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
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

    showContractStatus(type, message) {
        const statusBox = document.getElementById('contractStatus');
        statusBox.className = 'status-box ' + type;
        statusBox.innerHTML = message.replace(/\n/g, '<br>');
    }

    // ============ Tab 切换功能 ============

    switchTab(tabName) {
        // 更新 tab 按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // 更新 tab 内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tabName === 'direct') {
            document.getElementById('directTab').classList.add('active');
        } else if (tabName === 'contract') {
            document.getElementById('contractTab').classList.add('active');
        }
    }

    // ============ 直接转账功能 ============

    async fetchDirectTransactions() {
        try {
            this.showStatus('loading', '⏳ 使用 Ethers.js 获取交易历史...');

            const currentBlock = this.currentBlockNumber;
            console.log('当前交易的区块号:', currentBlock);
            const history = await this.getTransactionsFromBlocks(currentBlock);

            this.displayDirectTransactions(history);
            this.showStatus('success', `✅ 通过 Ethers.js 获取了 ${history.length} 条交易记录`);

        } catch (error) {
            console.error('获取交易失败:', error);
            this.showStatus('error', '❌ 获取交易失败: ' + error.message);
        }
    }

    displayDirectTransactions(transactions) {
        const container = document.getElementById('directTxHistory');

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

    // ============ 合约功能 ============

    async updateContractInfo() {
        try {
            const userBalance = await this.contractService.getBalance(this.userAddress);
            const contractBalance = await this.contractService.getContractBalance();
            
            document.getElementById('contractAddress').textContent = this.contractService.contractAddress;
            document.getElementById('contractUserBalance').textContent = parseFloat(userBalance).toFixed(6);
            document.getElementById('contractTotalBalance').textContent = parseFloat(contractBalance).toFixed(6);
        } catch (error) {
            console.error('更新合约信息失败:', error);
            document.getElementById('contractUserBalance').textContent = '无法获取';
            document.getElementById('contractTotalBalance').textContent = '无法获取';
            this.showContractStatus('error', '⚠️ 无法连接到合约，请确保：\n1. 已连接到正确的网络\n2. 合约地址正确\n3. 合约已部署');
        }
    }

    async refreshContractBalance() {
        try {
            this.showContractStatus('loading', '⏳ 刷新余额中...');
            await this.updateContractInfo();
            this.showContractStatus('success', '✅ 余额已刷新');
        } catch (error) {
            console.error('刷新余额失败:', error);
            this.showContractStatus('error', '❌ 刷新失败: ' + error.message);
        }
    }

    async contractDeposit() {
        const amount = document.getElementById('contractDepositAmount').value.trim();

        if (!amount || parseFloat(amount) <= 0) {
            this.showContractStatus('error', '❌ 请输入有效的存入金额');
            return;
        }

        try {
            this.showContractStatus('loading', '⏳ 正在向合约存入 ETH...');

            const tx = await this.contractService.deposit(amount);
            this.showContractStatus('loading', `⏳ 交易已提交，等待确认...\nTxHash: ${tx.hash}`);

            const receipt = await tx.wait();
            console.log('存入成功:', receipt);

            this.showContractStatus('success',
                `✅ 存入成功!\n` +
                `金额: ${amount} ETH\n` +
                `TxHash: ${receipt.hash}\n` +
                `Gas Used: ${receipt.gasUsed.toString()}`
            );

            await this.updateWalletInfo();
            await this.updateContractInfo();
            document.getElementById('contractDepositAmount').value = '';

        } catch (error) {
            console.error('存入失败:', error);
            this.showContractStatus('error', '❌ 存入失败: ' + (error.reason || error.message));
        }
    }

    async contractTransfer() {
        const recipient = document.getElementById('contractTransferTo').value.trim();
        const amount = document.getElementById('contractTransferAmount').value.trim();

        if (!isAddress(recipient)) {
            this.showContractStatus('error', '❌ 请输入有效的以太坊地址');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            this.showContractStatus('error', '❌ 请输入有效的转账金额');
            return;
        }

        try {
            this.showContractStatus('loading', '⏳ 正在通过合约转账...');

            const tx = await this.contractService.transfer(recipient, amount);
            this.showContractStatus('loading', `⏳ 交易已提交，等待确认...\nTxHash: ${tx.hash}`);

            const receipt = await tx.wait();
            console.log('转账成功:', receipt);

            this.showContractStatus('success',
                `✅ 合约转账成功!\n` +
                `接收地址: ${recipient}\n` +
                `金额: ${amount} ETH\n` +
                `TxHash: ${receipt.hash}\n` +
                `Gas Used: ${receipt.gasUsed.toString()}`
            );

            await this.updateContractInfo();
            document.getElementById('contractTransferTo').value = '';
            document.getElementById('contractTransferAmount').value = '';

        } catch (error) {
            console.error('转账失败:', error);
            this.showContractStatus('error', '❌ 转账失败: ' + (error.reason || error.message));
        }
    }

    async contractWithdraw() {
        const amount = document.getElementById('contractWithdrawAmount').value.trim();

        if (!amount || parseFloat(amount) <= 0) {
            this.showContractStatus('error', '❌ 请输入有效的提取金额');
            return;
        }

        try {
            this.showContractStatus('loading', '⏳ 正在从合约提取 ETH...');

            const tx = await this.contractService.withdraw(amount);
            this.showContractStatus('loading', `⏳ 交易已提交，等待确认...\nTxHash: ${tx.hash}`);

            const receipt = await tx.wait();
            console.log('提取成功:', receipt);

            this.showContractStatus('success',
                `✅ 提取成功!\n` +
                `金额: ${amount} ETH\n` +
                `TxHash: ${receipt.hash}\n` +
                `Gas Used: ${receipt.gasUsed.toString()}`
            );

            await this.updateWalletInfo();
            await this.updateContractInfo();
            document.getElementById('contractWithdrawAmount').value = '';

        } catch (error) {
            console.error('提取失败:', error);
            this.showContractStatus('error', '❌ 提取失败: ' + (error.reason || error.message));
        }
    }
}

export default WalletApp;
// const app = new WalletApp();
