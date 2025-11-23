import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { config } from './config/wagmi';
import { Layout } from './components/Layout';
import { DirectTransfer } from './pages/DirectTransfer';
import { ContractTransfer } from './pages/ContractTransfer';
import { RedPacket } from './pages/RedPacket';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/direct" replace />} />
                <Route path="/direct" element={<DirectTransfer />} />
                <Route path="/contract" element={<ContractTransfer />} />
                <Route path="/redpacket" element={<RedPacket />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </JotaiProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
