import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, goerli, localhost } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const infuraKey = import.meta.env.VITE_INFURA_KEY;
// 配置支持的网络
export const config = createConfig({
  chains: [sepolia, mainnet, goerli, localhost],
  connectors: [
    injected(), // 支持 MetaMask 等注入式钱包
  ],
  transports: {
    // Sepolia 测试网 (使用Infura)
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${infuraKey}`),
    // 主网
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${infuraKey}`),
    // Goerli 测试网
    [goerli.id]: http(`https://goerli.infura.io/v3/${infuraKey}`),
    // 本地网络
    [localhost.id]: http('http://127.0.0.1:8545'),
  },
});
