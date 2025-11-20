import { useState } from 'react';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';

export function DirectTransfer() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);

  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

 

  // 加载最近的交易记录
  const loadRecentTransactions = async () => {
    if (!address || !publicClient) return;

    try {
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock - 5n; // 查询最近5个区块

      const logs = await publicClient.getLogs({
        address:undefined, // 监听所有地址
        fromBlock,  
        toBlock: 'latest',
      });

      // 过滤与当前地址相关的交易
      const recentTxs = logs
        .filter((log: any) =>
          log.topics.includes(address.toLowerCase()) ||
          log.address?.toLowerCase() === address.toLowerCase()
        )
        .slice(0, 10);

      setTransactions(recentTxs);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient || !amount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  if(isSuccess){
      loadRecentTransactions();
  }
  
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to use direct transfer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Direct Transfer</h1>
        <p className="text-gray-400">Send ETH directly to any address using Infura RPC</p>
      </div>

      {/* 余额卡片 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-xl">
        <div className="text-blue-200 text-sm mb-1">Your Balance</div>
        <div className="text-4xl font-bold text-white">
          {balance ? formatEther(balance.value) : '0.0'} ETH
        </div>
        <div className="text-blue-200 text-sm mt-2">on Sepolia Testnet</div>
      </div>

      {/* 转账表单 */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Send Transaction</h2>
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
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {isPending ? 'Confirming in wallet...' : isConfirming ? 'Processing...' : 'Send Transaction'}
          </button>
        </form>

        {/* 交易状态 */}
        {hash && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
            <div className="text-green-400 font-medium mb-1">Transaction Submitted</div>
            <div className="text-sm text-gray-300 break-all">
              Hash: {hash}
            </div>
            {isConfirming && (
              <div className="text-yellow-400 text-sm mt-2">Waiting for confirmation...</div>
            )}
            {isSuccess && (
              <div className="text-green-400 text-sm mt-2">Transaction confirmed!</div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="text-red-400 font-medium">Error</div>
            <div className="text-sm text-gray-300">{error.message}</div>
          </div>
        )}
      </div>

      {/* 交易历史 */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
          <button
            onClick={loadRecentTransactions}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No recent transactions found. Click Refresh to load.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">Block #{tx.blockNumber?.toString()}</div>
                  <div className="text-xs font-mono text-gray-500">
                    {tx.transactionHash?.slice(0, 10)}...{tx.transactionHash?.slice(-8)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
