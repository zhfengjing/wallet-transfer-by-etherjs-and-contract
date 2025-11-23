import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { RED_PACKET_ADDRESS, RED_PACKET_ABI } from '../constants/contract';

const VITE_SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;

interface RedPacketPublished {
  id: string;
  owner: string;
  totalPackets: string;
  totalAmount: string;
  isEqual: boolean;
  timestamp: string;
  transactionHash: string;
}

interface RedPacketGrabbed {
  id: string;
  grabber: string;
  amount: string;
  timestamp: string;
  transactionHash: string;
}

interface RedPacketReclaimed {
  id: string;
  owner: string;
  amount: string;
  timestamp: string;
  transactionHash: string;
}

export function RedPacket() {
  const { address, isConnected } = useAccount();

  // 表单状态
  const [totalPackets, setTotalPackets] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [isEqual, setIsEqual] = useState(true);

  // 交易记录
  const [publishedRecords, setPublishedRecords] = useState<RedPacketPublished[]>([]);
  const [grabbedRecords, setGrabbedRecords] = useState<RedPacketGrabbed[]>([]);
  const [reclaimedRecords, setReclaimedRecords] = useState<RedPacketReclaimed[]>([]);
  const [loading, setLoading] = useState(false);

  // 读取合约状态（添加 watch: true 实现实时更新）
  const { data: owner, refetch: refetchOwner } = useReadContract({
    address: RED_PACKET_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'owner',
    watch: true,
  });

  const { data: remainingPackets, refetch: refetchRemainingPackets } = useReadContract({
    address: RED_PACKET_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'remainingPackets',
    watch: true,
  });

  const { data: remainingAmount, refetch: refetchRemainingAmount } = useReadContract({
    address: RED_PACKET_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'remainingAmount',
    watch: true,
  });

  const { data: contractTotalPackets, refetch: refetchTotalPackets } = useReadContract({
    address: RED_PACKET_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'totalPackets',
    watch: true,
  });

  const { data: contractTotalAmount, refetch: refetchTotalAmount } = useReadContract({
    address: RED_PACKET_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'totalAmount',
    watch: true,
  });

  const { data: currentRoundId, refetch: refetchCurrentRoundId } = useReadContract({
    address: RED_PACKET_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'currentRoundId',
    watch: true,
  });

  const { data: hasGrabbedCurrentRound, refetch: refetchHasGrabbed } = useReadContract({
    address: RED_PACKET_ADDRESS,
    abi: RED_PACKET_ABI,
    functionName: 'hasGrabbedCurrentRound',
    args: address ? [address] : undefined,
    watch: true,
  });

  // 写入合约（添加错误捕获）
  const { writeContract: publishRedPacket, data: publishHash, isPending: isPublishing, error: publishError } = useWriteContract();
  const { writeContract: grabRedPacket, data: grabHash, isPending: isGrabbing, error: grabError } = useWriteContract();
  const { writeContract: reclaimUnclaimed, data: reclaimHash, isPending: isReclaiming, error: reclaimError } = useWriteContract();

  // 等待交易确认
  const { isLoading: isPublishConfirming, isSuccess: isPublishSuccess } = useWaitForTransactionReceipt({ hash: publishHash });
  const { isLoading: isGrabConfirming, isSuccess: isGrabSuccess } = useWaitForTransactionReceipt({ hash: grabHash });
  const { isLoading: isReclaimConfirming, isSuccess: isReclaimSuccess } = useWaitForTransactionReceipt({ hash: reclaimHash });

  // 从 The Graph 查询记录
  const fetchRecords = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // The Graph endpoint - 请根据实际部署的 subgraph 修改
      const endpoint = VITE_SUBGRAPH_URL;

      console.log('📊 The Graph 查询配置:');
      console.log('- Endpoint:', endpoint);
      console.log('- 当前地址:', address);

      if (!endpoint) {
        console.error('❌ VITE_SUBGRAPH_URL 未配置');
        return;
      }

      const query = `
        query GetRedPacketRecords {
          redPacketPublisheds(orderBy: timestamp, orderDirection: desc, first: 10) {
            id
            owner
            totalPackets
            totalAmount
            isEqual
            timestamp
            transactionHash
          }
          redPacketGrabbeds(orderBy: timestamp, orderDirection: desc, first: 20) {
            id
            grabber
            amount
            timestamp
            transactionHash
          }
          redPacketReclaimeds(orderBy: timestamp, orderDirection: desc, first: 10) {
            id
            owner
            amount
            timestamp
            transactionHash
          }
        }
      `;

      console.log('🔍 发送 GraphQL 查询...');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      console.log('📡 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ 请求失败:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('错误详情:', errorText);
        return;
      }

      const result = await response.json();
      console.log('✅ 查询结果:', result);

      if (result.errors) {
        console.error('❌ GraphQL 错误:', result.errors);
        return;
      }

      if (result.data) {
        const publishedCount = result.data.redPacketPublisheds?.length || 0;
        const grabbedCount = result.data.redPacketGrabbeds?.length || 0;
        const reclaimedCount = result.data.redPacketReclaimeds?.length || 0;

        console.log(`📦 查询到的记录数:`);
        console.log(`  - 发红包: ${publishedCount} 条`);
        console.log(`  - 抢红包: ${grabbedCount} 条`);
        console.log(`  - 收回红包: ${reclaimedCount} 条`);

        setPublishedRecords(result.data.redPacketPublisheds || []);
        setGrabbedRecords(result.data.redPacketGrabbeds || []);
        setReclaimedRecords(result.data.redPacketReclaimeds || []);
      } else {
        console.warn('⚠️ 查询结果中没有 data 字段');
      }
    } catch (error) {
      console.error('❌ The Graph 查询失败:', error);
      if (error instanceof Error) {
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  // 手动刷新所有合约数据
  const refetchAllContractData = () => {
    refetchOwner();
    refetchRemainingPackets();
    refetchRemainingAmount();
    refetchTotalPackets();
    refetchTotalAmount();
    refetchCurrentRoundId();
    refetchHasGrabbed();
  };

  // 交易成功后刷新数据
  useEffect(() => {
    if (isPublishSuccess || isGrabSuccess || isReclaimSuccess) {
      if (isPublishSuccess) {
        setTotalAmount('');
        setTotalPackets('');
      }
      // 立即刷新合约数据
      refetchAllContractData();

      // 延迟刷新 The Graph 数据（等待索引）
      setTimeout(() => {
        fetchRecords();
      }, 3000); // 等待 3 秒让 The Graph 索引
    }
  }, [isPublishSuccess, isGrabSuccess, isReclaimSuccess]);

  // 页面加载时获取记录
  useEffect(() => {
    fetchRecords();
  }, [address]);

  // 发红包
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!totalPackets || !totalAmount) {
      alert('请填写完整信息');
      return;
    }

    try {
      publishRedPacket({
        address: RED_PACKET_ADDRESS,
        abi: RED_PACKET_ABI,
        functionName: 'publishRedPacket',
        args: [parseInt(totalPackets), parseEther(totalAmount), isEqual],
        value: parseEther(totalAmount),
      });
    } catch (error: any) {
      console.error('Failed to publish red packet:', error);
      alert(error.message || '发红包失败');
    }
  };

  // 抢红包
  const handleGrab = async () => {
    try {
      grabRedPacket({
        address: RED_PACKET_ADDRESS,
        abi: RED_PACKET_ABI,
        functionName: 'grabRedPacket',
      });
    } catch (error: any) {
      console.error('Failed to grab red packet:', error);
      alert(error.message || '抢红包失败');
    }
  };

  // 收回红包
  const handleReclaim = async () => {
    try {
      reclaimUnclaimed({
        address: RED_PACKET_ADDRESS,
        abi: RED_PACKET_ABI,
        functionName: 'reclaimUnclaimed',
      });
    } catch (error: any) {
      console.error('Failed to reclaim red packet:', error);
      alert(error.message || '收回红包失败');
    }
  };

  // 检查用户是否已经抢过当前轮次的红包
  // 使用新合约的 hasGrabbedCurrentRound 函数，完美支持多轮红包
  const hasGrabbed = hasGrabbedCurrentRound || false;

  // 检查当前用户是否是红包发起者
  const isOwner = owner?.toLowerCase() === address?.toLowerCase();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">请先连接钱包</h2>
          <p className="text-gray-400">连接钱包后即可使用红包功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent mb-2">
          红包系统
        </h1>
        <p className="text-gray-400">发红包、抢红包、收回红包</p>
      </div>

      {/* 红包状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="text-blue-400 text-sm mb-2">当前轮次</div>
          <div className="text-3xl font-bold text-white">
            #{currentRoundId !== undefined ? currentRoundId.toString() : '0'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {currentRoundId !== undefined && currentRoundId > 0
              ? (remainingPackets === 0 || remainingAmount === BigInt(0)
                  ? '红包已结束'
                  : '红包进行中')
              : '暂无红包'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="text-red-400 text-sm mb-2">剩余红包数</div>
          <div className="text-3xl font-bold text-white">
            {remainingPackets !== undefined ? remainingPackets.toString() : '0'} / {contractTotalPackets !== undefined ? contractTotalPackets.toString() : '0'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="text-yellow-400 text-sm mb-2">剩余金额</div>
          <div className="text-3xl font-bold text-white">
            {remainingAmount !== undefined ? parseFloat(formatEther(remainingAmount)).toFixed(4) : '0.0000'} ETH
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
          <div className="text-purple-400 text-sm mb-2">总金额</div>
          <div className="text-3xl font-bold text-white">
            {contractTotalAmount !== undefined ? parseFloat(formatEther(contractTotalAmount)).toFixed(4) : '0.0000'} ETH
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 发红包 */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="w-2 h-8 bg-gradient-to-b from-red-500 to-pink-500 rounded-full mr-3"></span>
            发红包
          </h2>

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                红包个数
              </label>
              <input
                type="number"
                value={totalPackets}
                onChange={(e) => setTotalPackets(e.target.value)}
                min="1"
                max="255"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="请输入红包个数 (1-255)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                总金额 (ETH)
              </label>
              <input
                type="text"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="请输入总金额"
                required
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isEqual"
                checked={isEqual}
                onChange={(e) => setIsEqual(e.target.checked)}
                className="w-5 h-5 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="isEqual" className="text-sm text-gray-300">
                均分红包（不勾选则为拼手气红包）
              </label>
            </div>

            <button
              type="submit"
              disabled={isPublishing || isPublishConfirming}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-red-500/50 disabled:cursor-not-allowed"
            >
              {isPublishing || isPublishConfirming ? '发送中...' : '发红包'}
            </button>
          </form>

          {isPublishSuccess && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">红包发送成功！</p>
            </div>
          )}

          {publishError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm font-semibold mb-1">发红包失败</p>
              <p className="text-red-300 text-xs">{publishError.message}</p>
            </div>
          )}
        </div>

        {/* 抢红包 */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full mr-3"></span>
            抢红包
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <p className="text-gray-300 text-sm mb-2">当前状态</p>
              {hasGrabbed ? (
                <div className="flex items-center text-yellow-400">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-medium block">本轮红包已抢过</span>
                    <span className="text-xs text-gray-400">等待新一轮红包发布</span>
                  </div>
                </div>
              ) : remainingPackets && remainingPackets > 0 ? (
                <div className="flex items-center text-green-400">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-medium block">红包可抢</span>
                    <span className="text-xs text-gray-400">快来抢红包吧！</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-gray-400">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-medium block">红包已抢完</span>
                    <span className="text-xs text-gray-400">等待下一轮红包</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleGrab}
              disabled={isGrabbing || isGrabConfirming || hasGrabbed || !remainingPackets || remainingPackets === 0}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold text-lg rounded-lg transition-all shadow-lg hover:shadow-yellow-500/50 disabled:cursor-not-allowed"
            >
              {hasGrabbed ? '本轮已抢过' : (isGrabbing || isGrabConfirming) ? '抢红包中...' : '抢红包'}
            </button>

            {isGrabSuccess && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm">恭喜抢到红包！</p>
              </div>
            )}

            {grabError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-red-400 text-sm font-semibold">抢红包失败</p>
                    <p className="text-red-300 text-xs mt-1">
                      {grabError.message.includes('already grabbed') || grabError.message.includes('You have already grabbed')
                        ? '您已经抢过本轮红包了，请等待下一轮红包发布'
                        : grabError.message.includes('No red packet') || grabError.message.includes('No remaining packets')
                        ? '当前没有可抢的红包，请等待新红包发布'
                        : grabError.message.includes('No remaining')
                        ? '红包已被抢完，来晚了！'
                        : grabError.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 收回红包 */}
          {isOwner && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">红包管理</h3>
              <button
                onClick={handleReclaim}
                disabled={isReclaiming || isReclaimConfirming || !remainingAmount || remainingAmount === BigInt(0)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 disabled:cursor-not-allowed"
              >
                {isReclaiming || isReclaimConfirming ? '收回中...' : '收回剩余红包'}
              </button>

              {isReclaimSuccess && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">红包收回成功！</p>
                </div>
              )}

              {reclaimError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm font-semibold mb-1">收回红包失败</p>
                  <p className="text-red-300 text-xs">{reclaimError.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 交易记录 */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></span>
            交易记录
          </h2>
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-all text-sm"
          >
            {loading ? '刷新中...' : '刷新'}
          </button>
        </div>

        <div className="space-y-4">
          {/* 发红包记录 */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-3">发红包记录</h3>
            <div className="space-y-2">
              {publishedRecords.length > 0 ? (
                publishedRecords.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-gray-300 text-sm">
                          发起人: {record.owner.slice(0, 6)}...{record.owner.slice(-4)}
                        </p>
                        <p className="text-white font-semibold">
                          {record.totalPackets} 个红包，总额 {parseFloat(formatEther(BigInt(record.totalAmount))).toFixed(4)} ETH
                        </p>
                        <p className="text-gray-400 text-xs">
                          {record.isEqual ? '均分' : '拼手气'} | {new Date(parseInt(record.timestamp) * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      查看交易 →
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">暂无发红包记录</p>
              )}
            </div>
          </div>

          {/* 抢红包记录 */}
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">抢红包记录</h3>
            <div className="space-y-2">
              {grabbedRecords.length > 0 ? (
                grabbedRecords.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-gray-300 text-sm">
                          抢到者: {record.grabber.slice(0, 6)}...{record.grabber.slice(-4)}
                        </p>
                        <p className="text-white font-semibold">
                          抢到 {parseFloat(formatEther(BigInt(record.amount))).toFixed(4)} ETH
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(parseInt(record.timestamp) * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      查看交易 →
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">暂无抢红包记录</p>
              )}
            </div>
          </div>

          {/* 收回红包记录 */}
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-3">收回红包记录</h3>
            <div className="space-y-2">
              {reclaimedRecords.length > 0 ? (
                reclaimedRecords.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-gray-300 text-sm">
                          收回人: {record.owner.slice(0, 6)}...{record.owner.slice(-4)}
                        </p>
                        <p className="text-white font-semibold">
                          收回 {parseFloat(formatEther(BigInt(record.amount))).toFixed(4)} ETH
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(parseInt(record.timestamp) * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      查看交易 →
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">暂无收回红包记录</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
