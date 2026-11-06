import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  User,
  Wallet,
  Send,
  Layers,
  Check
} from 'lucide-react';
import TelegramConnectCard from './TelegramConnectCard';

const CHAINS = [
  { id: 'arbitrum', name: 'Arbitrum One', symbol: 'ARB' },
  { id: 'ethereum', name: 'Ethereum Mainnet', symbol: 'ETH' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP' },
  { id: 'polygon', name: 'Polygon PoS', symbol: 'POL' },
  { id: 'base', name: 'Base', symbol: 'BASE' },
];

const PROTOCOLS = [
  { id: 'aave_v3', name: 'Aave V3' },
  { id: 'compound_v3', name: 'Compound V3' },
  { id: 'spark', name: 'Spark Protocol' },
  { id: 'morpho', name: 'Morpho Blue' },
];

const DEMO_ADDRESS = '0x71C8401344445853782977E2A91D61b9a957B7E6';

export default function OnboardingCard({ user, onCompleteOnboarding, onSkipToDemo }) {
  const [borrowerName, setBorrowerName] = useState(user?.user_metadata?.name || '');
  const [protocol, setProtocol] = useState('aave_v3');
  const [walletMode, setWalletMode] = useState('demo'); // 'demo' | 'custom'
  const [chain, setChain] = useState('arbitrum');
  const [address, setAddress] = useState(DEMO_ADDRESS);
  const [label, setLabel] = useState('Aave V3 Arbitrum Vault');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleWalletModeChange = (mode) => {
    setWalletMode(mode);
    setError(null);
    if (mode === 'demo') {
      setChain('arbitrum');
      setAddress(DEMO_ADDRESS);
      setLabel('Aave V3 Arbitrum Vault');
    } else {
      setAddress('');
      setLabel('My DeFi Vault');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanAddress = address.trim();

    if (!cleanAddress) {
      setError('Please provide a public wallet address.');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      setError('Invalid EVM address format. Must be 42 characters starting with 0x.');
      return;
    }

    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onCompleteOnboarding({
        chain,
        address: cleanAddress,
        label: label.trim() || 'Monitored Vault',
        protocol,
        borrowerName: borrowerName.trim() || user?.email?.split('@')[0] || 'Borrower',
        is_primary: true,
      });
    }, 300);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-in fade-in duration-300">
      <div className="paper-card rounded-2xl p-6 sm:p-8 space-y-6 border-2 border-black shadow-[6px_6px_0_#000] bg-white">
        {/* Onboarding Header */}
        <div className="border-b-2 border-black pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-black bg-[#fef08a] px-2.5 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
              ACCOUNT ONBOARDING • SETUP YOUR WORKBENCH
            </span>
            <span className="text-xs font-mono font-black text-black/70 bg-black/5 px-2 py-0.5 rounded">
              {user?.email || 'Authenticated'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Welcome to Bachega.fi
          </h2>
          <p className="text-xs sm:text-sm text-black/80 mt-1 font-sans font-medium">
            Configure your borrower profile, choose a position to monitor, and link our Telegram bot for instant liquidation warnings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Borrower Profile Information */}
          <div className="p-4 rounded-xl bg-[#fffdf5] border-2 border-black shadow-[3px_3px_0_#000] space-y-4">
            <div className="flex items-center space-x-2 border-b-2 border-black/10 pb-2">
              <User className="w-4 h-4 text-[#3b82f6]" />
              <h3 className="text-xs font-mono font-black uppercase text-black">
                Step 1: Borrower Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black mb-1 font-mono">
                  Display Name / Handle
                </label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="e.g. Satoshi, Anon DeFi"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-mono font-bold focus:outline-none focus:shadow-[3px_3px_0_#000]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1 font-mono">
                  Primary Lending Protocol
                </label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-black focus:outline-none shadow-[2px_2px_0_#000]"
                >
                  {PROTOCOLS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Wallet & Position Selection */}
          <div className="p-4 rounded-xl bg-[#fffdf5] border-2 border-black shadow-[3px_3px_0_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-[#16a34a]" />
                <h3 className="text-xs font-mono font-black uppercase text-black">
                  Step 2: Position To Stress-Test
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#86efac] text-[#065f46] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
                100% READ-ONLY
              </span>
            </div>

            {/* Mode Selector: Demo vs Custom */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleWalletModeChange('demo')}
                className={`p-3 rounded-xl border-2 border-black text-left transition-all ${
                  walletMode === 'demo'
                    ? 'bg-[#fef08a] shadow-[3px_3px_0_#000]'
                    : 'bg-white hover:bg-black/5 shadow-[2px_2px_0_#000]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
                    Live Demo Vault
                  </span>
                  {walletMode === 'demo' && <Check className="w-3.5 h-3.5 text-black" />}
                </div>
                <p className="text-[11px] text-black/70 mt-1 font-medium">
                  Verified Aave v3 Arbitrum position (2.5 ETH, $4.5k debt). No setup needed.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleWalletModeChange('custom')}
                className={`p-3 rounded-xl border-2 border-black text-left transition-all ${
                  walletMode === 'custom'
                    ? 'bg-[#fef08a] shadow-[3px_3px_0_#000]'
                    : 'bg-white hover:bg-black/5 shadow-[2px_2px_0_#000]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#3b82f6]" />
                    Track My Address
                  </span>
                  {walletMode === 'custom' && <Check className="w-3.5 h-3.5 text-black" />}
                </div>
                <p className="text-[11px] text-black/70 mt-1 font-medium">
                  Paste any public 0x address. Non-custodial, no private keys required.
                </p>
              </button>
            </div>

            {/* Custom Wallet Inputs */}
            {walletMode === 'custom' ? (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-black mb-1 font-mono">
                      Blockchain Network
                    </label>
                    <select
                      value={chain}
                      onChange={(e) => setChain(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-black focus:outline-none shadow-[2px_2px_0_#000]"
                    >
                      {CHAINS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black mb-1 font-mono">
                      Position Label / Nickname
                    </label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. My Arbitrum Vault"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-mono font-bold focus:outline-none focus:shadow-[3px_3px_0_#000]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1 font-mono">
                    Public Wallet Address (0x...)
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x71C8401344445853782977E2A91D61b9a957B7E6"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-mono font-bold focus:outline-none focus:shadow-[3px_3px_0_#000]"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white border-2 border-black/20 text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="font-bold text-black">Active Preset: </span>
                  <span className="text-black/80">Arbitrum One • 0x71C8...B7E6</span>
                </div>
                <span className="text-[10px] font-black uppercase bg-[#86efac] text-[#065f46] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
                  Preloaded
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-[#fee2e2] border-2 border-black shadow-[2px_2px_0_#000] text-xs text-[#991515] flex items-center space-x-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626]" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* SECTION 3: Connect Telegram Chatbot (@Bachega_bot) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-[#229ED9]" />
                <h3 className="text-xs font-mono font-black uppercase text-black">
                  Step 3: Connect Telegram Risk Bot (@Bachega_bot)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-black/60">
                RECOMMENDED
              </span>
            </div>

            {/* Embedded 1-Click Telegram Card */}
            <TelegramConnectCard currentUser={user} />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-black">
            <button
              type="button"
              onClick={onSkipToDemo}
              className="text-xs font-black text-black/70 hover:text-black transition-colors underline order-2 sm:order-1"
            >
              Skip setup and load default demo
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-3d-royal w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 disabled:opacity-50 order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configuring Workbench...</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
