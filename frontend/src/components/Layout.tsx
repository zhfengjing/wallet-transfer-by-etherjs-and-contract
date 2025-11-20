import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { sepolia, mainnet, goerli, localhost } from 'wagmi/chains';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { chains, switchChain } = useSwitchChain();
  const chainId = useChainId();

  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // 网络配置
  const networks = [
    { id: sepolia.id, name: 'Sepolia Testnet', chain: sepolia },
    { id: mainnet.id, name: 'Ethereum Mainnet', chain: mainnet },
    { id: goerli.id, name: 'Goerli Testnet', chain: goerli },
    { id: localhost.id, name: 'Localhost', chain: localhost },
  ];

  const currentNetwork = networks.find(n => n.id === chainId);

  // 连接MetaMask
  const handleConnect = () => {
    const metamaskConnector = connectors.find(c => c.name === 'MetaMask' || c.type === 'injected');
    if (metamaskConnector) {
      connect({ connector: metamaskConnector });
    } else {
      alert('请先安装 MetaMask 钱包插件！');
    }
  };

  // 切换网络
  const handleSwitchNetwork = async (networkId: number) => {
    try {
      console.log('=== Network Switch Debug ===');
      console.log('Attempting to switch to network ID:', networkId);
      console.log('Current chain ID:', chainId);
      console.log('Available chains:', chains);
      console.log('switchChain function available:', !!switchChain);
      console.log('Is connected:', isConnected);

      if (!isConnected) {
        alert('请先连接钱包');
        setShowNetworkMenu(false);
        return;
      }

      if (!switchChain) {
        console.error('switchChain is not available');
        alert('网络切换功能不可用');
        setShowNetworkMenu(false);
        return;
      }

      // 执行切换
      console.log('Calling switchChain...');
      await switchChain({ chainId: networkId });
      console.log('Network switched successfully to:', networkId);
      setShowNetworkMenu(false);
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        code: error?.code
      });

      // 根据错误类型提供更具体的提示
      let errorMessage = '切换网络失败';
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      if (error?.code === 4902) {
        errorMessage = '该网络未添加到 MetaMask，请先在 MetaMask 中添加该网络';
      }

      alert(errorMessage);
      setShowNetworkMenu(false);
    }
  };

  // 切换账户（通过MetaMask）
  const handleSwitchAccount = async (e: any) => {
    e.stopPropagation();
    try {
      // 先断开连接
      disconnect();
      // 等待一小段时间确保断开完成
      await new Promise(resolve => setTimeout(resolve, 100));
      // 重新连接，这会触发 MetaMask 弹出账号选择
      const metamaskConnector = connectors.find(c => c.name === 'MetaMask' || c.type === 'injected');
      if (metamaskConnector) {
        connect({ connector: metamaskConnector });
      }
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Failed to switch account:', error);
      alert('切换账号失败，请在 MetaMask 中手动切换账号后刷新页面');
    }
  };

  // 断开连接
  const handleDisconnect = async (e:any) => {
    e.stopPropagation();
    try {
      console.log('Disconnecting wallet...');
      await disconnect();
      setShowAccountMenu(false);
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      // 即使出错也关闭菜单
      setShowAccountMenu(false);
    }
  };

  // 复制地址
  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      alert('地址已复制到剪贴板！');
    }
  };

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Wallet Transfer
              </h1>
            </div>

            {/* 导航链接 */}
            <div className="flex space-x-4">
              <Link
                to="/direct"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/direct')
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Direct Transfer
              </Link>
              <Link
                to="/contract"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/contract')
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Contract Transfer
              </Link>
            </div>

            {/* 钱包连接区域 */}
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <>
                  {/* 网络选择器 */}
                  <div className="relative" style={{ zIndex: 9999 }}>
                    <button
                      onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        chainId === sepolia.id ? 'bg-green-400' :
                        chainId === mainnet.id ? 'bg-blue-400' :
                        'bg-yellow-400'
                      }`} />
                      <span className="text-sm">{currentNetwork?.name || 'Unknown'}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showNetworkMenu && (
                      <div
                        className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700"
                        style={{ zIndex: 9999 }}
                        onClick={(e) => {
                          console.log('Menu container clicked');
                          e.stopPropagation();
                        }}
                      >
                        <div className="py-2">
                          {networks.map((network) => (
                            <button
                              key={network.id}
                              onClick={(e) => {
                                console.log('=== BUTTON CLICKED ===', network.name, network.id);
                                e.stopPropagation();
                                e.preventDefault();
                                console.log('About to call handleSwitchNetwork');
                                handleSwitchNetwork(network.id);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                                chainId === network.id ? 'text-blue-400 bg-gray-700/50' : 'text-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{network.name}</span>
                                {chainId === network.id && (
                                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 账户信息 */}
                  <div className="relative" style={{ zIndex: 9999 }}>
                    <button
                      onClick={() => setShowAccountMenu(!showAccountMenu)}
                      className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg"
                    >
                      <div>
                        <div className="text-xs text-blue-200">余额</div>
                        <div className="text-sm font-bold">
                          {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} ETH
                        </div>
                      </div>
                      <div className="border-l border-white/20 pl-3">
                        <div className="text-xs text-blue-200">账户</div>
                        <div className="text-sm font-mono">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </div>
                      </div>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showAccountMenu && (
                      <div
                        className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700"
                        style={{ zIndex: 9999 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 border-b border-gray-700">
                          <div className="text-xs text-gray-400 mb-1">当前账户</div>
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-white text-sm">
                              {address?.slice(0, 10)}...{address?.slice(-8)}
                            </div>
                            <button
                              onClick={handleCopyAddress}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title="复制地址"
                            >
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">余额</div>
                            <div className="text-2xl font-bold text-white">
                              {balance ? parseFloat(formatEther(balance.value)).toFixed(6) : '0.000000'} ETH
                            </div>
                            {balance && (
                              <div className="text-xs text-gray-400 mt-1">
                                {formatEther(balance.value)} ETH (完整)
                              </div>
                            )}
                          </div>
                          {connector && (
                            <div className="mt-2 text-xs text-gray-400">
                              连接方式: {connector.name}
                            </div>
                          )}
                        </div>
                        <div className="py-2">
                          <button
                            onClick={handleSwitchAccount}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            切换账户
                          </button>
                          <button
                            onClick={handleDisconnect}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            断开连接
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>Connect MetaMask</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* 点击外部关闭菜单 */}
      {/* 暂时注释掉遮罩层用于调试 */}
      {/* {(showNetworkMenu || showAccountMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNetworkMenu(false);
            setShowAccountMenu(false);
          }}
        />
      )} */}
    </div>
  );
}

// 为 window.ethereum 添加类型声明
declare global {
  interface Window {
    ethereum?: any;
  }
}
