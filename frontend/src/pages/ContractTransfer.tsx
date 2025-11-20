import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { request } from 'graphql-request';
import { WALLET_TRANSFER_ADDRESS, WALLET_TRANSFER_ABI } from '../constants/contract';
import { SUBGRAPH_URL, GET_TRANSFERS_QUERY, GET_USER_TRANSFERS_QUERY } from '../constants/subgraph';

interface Transfer {
  id: string;
  from: string;
  to: string;
  amount: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export function ContractTransfer() {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  // 读取合约中的余额
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: WALLET_TRANSFER_ADDRESS,
    abi: WALLET_TRANSFER_ABI,
    functionName: 'getBalance',
    args: address ? [address] : undefined,
  });

  // 存款
  const { writeContract: deposit, data: depositHash, isPending: isDepositPending } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // 转账
  const { writeContract: transfer, data: transferHash, isPending: isTransferPending, error: transferError } = useWriteContract();
  const { isLoading: isTransferConfirming, isSuccess: isTransferSuccess } = useWaitForTransactionReceipt({
    hash: transferHash,
  });

  // 从The Graph加载转账记录
  const loadTransfers = async () => {
    if (!address) return;

    setIsLoadingTransfers(true);
    try {
      const data = await request<{ transfers: Transfer[] }>(
        SUBGRAPH_URL,
        GET_USER_TRANSFERS_QUERY,
        {
          userAddress: address.toLowerCase(),
          first: 20,
          skip: 0,
        }
      );
      setTransfers(data.transfers);
    } catch (err) {
      console.error('Failed to load transfers from subgraph:', err);
      // 如果subgraph查询失败，显示提示
      alert('Failed to load transaction history. Please make sure the subgraph URL is correctly configured.');
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  // 当交易成功时重新加载数据
  useEffect(() => {
    if (isDepositSuccess || isTransferSuccess) {
      refetchBalance();
      setTimeout(loadTransfers, 2000); // 等待subgraph索引
    }
  }, [isDepositSuccess, isTransferSuccess]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;

    deposit({
      address: WALLET_TRANSFER_ADDRESS,
      abi: WALLET_TRANSFER_ABI,
      functionName: 'deposit',
      value: parseEther(depositAmount),
    });
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    transfer({
      address: WALLET_TRANSFER_ADDRESS,
      abi: WALLET_TRANSFER_ABI,
      functionName: 'transfer',
      args: [recipient as `0x${string}`, parseEther(amount)],
    });
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to use contract transfer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Contract Transfer</h1>
        <p className="text-gray-400">Transfer funds using smart contract with The Graph indexing</p>
      </div>

      {/* 合约余额卡片 */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-xl">
        <div className="text-purple-200 text-sm mb-1">Your Contract Balance</div>
        <div className="text-4xl font-bold text-white">
          {contractBalance ? formatEther(contractBalance as bigint) : '0.0'} ETH
        </div>
        <div className="text-purple-200 text-sm mt-2">in WalletTransfer Contract</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 存款表单 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Deposit to Contract</h2>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="text"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isDepositPending || isDepositConfirming}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isDepositPending ? 'Confirming...' : isDepositConfirming ? 'Processing...' : 'Deposit'}
            </button>
          </form>

          {depositHash && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
              <div className="text-green-400 font-medium mb-1">Deposit Submitted</div>
              <div className="text-xs text-gray-300 break-all font-mono">
                {depositHash}
              </div>
            </div>
          )}
        </div>

        {/* 转账表单 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Transfer via Contract</h2>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isTransferPending || isTransferConfirming}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isTransferPending ? 'Confirming...' : isTransferConfirming ? 'Processing...' : 'Transfer'}
            </button>
          </form>

          {transferHash && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
              <div className="text-green-400 font-medium mb-1">Transfer Submitted</div>
              <div className="text-xs text-gray-300 break-all font-mono">
                {transferHash}
              </div>
            </div>
          )}

          {transferError && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="text-red-400 font-medium">Error</div>
              <div className="text-sm text-gray-300">{transferError.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* 交易历史 (从The Graph获取) */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Transaction History
            <span className="text-sm font-normal text-gray-400 ml-2">(from The Graph)</span>
          </h2>
          <button
            onClick={loadTransfers}
            disabled={isLoadingTransfers}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isLoadingTransfers ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No transfers found. Click Refresh to load from The Graph.
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((tx) => (
              <div
                key={tx.id}
                className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-purple-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.from.toLowerCase() === address?.toLowerCase()
                          ? 'bg-red-900/50 text-red-300'
                          : 'bg-green-900/50 text-green-300'
                      }`}>
                        {tx.from.toLowerCase() === address?.toLowerCase() ? 'Sent' : 'Received'}
                      </span>
                      <span className="text-white font-semibold">
                        {formatEther(BigInt(tx.amount))} ETH
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      From: <span className="font-mono">{tx.from.slice(0, 10)}...{tx.from.slice(-8)}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      To: <span className="font-mono">{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(parseInt(tx.timestamp) * 1000).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Block #{tx.blockNumber}
                    </div>
                  </div>
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                >
                  {tx.transactionHash}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
