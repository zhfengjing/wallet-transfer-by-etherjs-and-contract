import { useState, useEffect } from 'react';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, formatEther, stringToHex, hexToString } from 'viem';

export function DirectTransfer() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);

  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 交易成功后清空表单
  useEffect(() => {
    if (isSuccess) {
      setRecipient('');
      setAmount('');
      setMemo('');
    }
  }, [isSuccess]);

  // 加载最近的交易记录
  const loadRecentTransactions = async () => {
    if (!address || !publicClient) return;

    try {
      console.log('Loading recent transactions for address:', address);
      const latestBlockNumber = await publicClient.getBlockNumber();
      console.log('Latest block:', latestBlockNumber);

      const recentTxs: any[] = [];
      const blocksToCheck = 100; // 检查最近100个区块

      // 遍历最近的区块查找与当前地址相关的交易
      for (let i = 0; i < blocksToCheck && recentTxs.length < 10; i++) {
        const blockNumber = latestBlockNumber - BigInt(i);

        try {
          const block = await publicClient.getBlock({
            blockNumber,
            includeTransactions: true,
          });

          // 检查区块中的交易
          if (block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx === 'object') {
                // 检查交易的 from 或 to 是否是当前地址
                if (
                  tx.from?.toLowerCase() === address.toLowerCase() ||
                  tx.to?.toLowerCase() === address.toLowerCase()
                ) {
                  // 尝试从data字段解析备注
                  let memo = '';
                  if (tx.input && tx.input !== '0x') {
                    try {
                      memo = hexToString(tx.input, { size: 32 }).replace(/\0/g, '');
                    } catch (err) {
                      console.error('Error parsing memo from tx input:', err);
                      // 如果解析失败，可能是合约调用或其他数据，忽略即可
                      console.log('Failed to parse memo from tx:', tx.hash);
                    }
                  }

                  recentTxs.push({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: tx.value,
                    blockNumber: block.number,
                    timestamp: block.timestamp,
                    memo: memo,
                  });

                  if (recentTxs.length >= 10) break;
                }
              }
            }
          }
        } catch (blockErr) {
          console.error(`Error fetching block ${blockNumber}:`, blockErr);
        }
      }

      console.log('Found transactions:', recentTxs);
      setTransactions(recentTxs);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      alert('Failed to load transactions. Please try again.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient || !amount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // 将备注编码为hex格式
      const data = memo ? stringToHex(memo) : undefined;

      sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
        data: data,
      });
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  
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
          {balance ? Number(formatEther(balance.value)).toFixed(4) : '0.0000'} ETH
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Remark (Optional)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add a note for this transaction..."
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">Block #{tx.blockNumber?.toString()}</div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      tx.from?.toLowerCase() === address?.toLowerCase()
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-green-900/30 text-green-400'
                    }`}>
                      {tx.from?.toLowerCase() === address?.toLowerCase() ? 'Sent' : 'Received'}
                    </div>
                  </div>

                  <div className="text-xs font-mono text-gray-500 break-all">
                    Hash: {tx.hash?.slice(0, 20)}...{tx.hash?.slice(-20)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">From:</span>
                      <div className="font-mono text-gray-300 truncate">
                        {tx.from?.slice(0, 10)}...{tx.from?.slice(-8)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">To:</span>
                      <div className="font-mono text-gray-300 truncate">
                        {tx.to?.slice(0, 10)}...{tx.to?.slice(-8)}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-white">
                    {formatEther(tx.value || 0n)} ETH
                  </div>

                  {tx.memo && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="text-xs text-gray-400 mb-1">Remark:</div>
                      <div className="text-sm text-gray-300 italic">"{tx.memo}"</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
