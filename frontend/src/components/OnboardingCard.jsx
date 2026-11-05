import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import TelegramConnectCard from './TelegramConnectCard';

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum Mainnet', symbol: 'ETH' },
  { id: 'arbitrum', name: 'Arbitrum One', symbol: 'ARB' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP' },
  { id: 'polygon', name: 'Polygon PoS', symbol: 'POL' },
];

const DEMO_ADDRESS = '0x71C8401344445853782977E2A91D61b9a957B7E6';

export default function OnboardingCard({ user, onCompleteOnboarding, onSkipToDemo }) {
  const [chain, setChain] = useState('arbitrum');
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('Personal DeFi Vault');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
        is_primary: true,
      });
    }, 400);
  };

  const handleUseDemoPreset = () => {
    setChain('arbitrum');
    setAddress(DEMO_ADDRESS);
    setLabel('Aave V3 Arbitrum Vault');
    setError(null);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 animate-in fade-in duration-300">
      <div className="paper-card rounded-2xl p-8 space-y-6">
        {/* Onboarding Header */}
        <div className="border-b border-[#e8d4a8] pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#b45309] bg-[#fef3c7] px-2.5 py-0.5 rounded border border-[#fde68a]">
              STEP 2 OF 2 • WALLET ONBOARDING
            </span>
            <span className="text-xs font-mono text-[#786e5e]">
              {user?.email || 'Authenticated'}
            </span>
          </div>
          <h2 className="text-2xl font-heritage font-black text-[#1c1812] tracking-tight">
            Connect Your Borrowing Position
          </h2>
          <p className="text-xs text-[#443a2b] mt-1 font-sans">
            Paste any public Ethereum or Layer-2 wallet address. Bachega tracks collateral Health Factors in 100% read-only mode without custody or private keys.
          </p>
        </div>

        {/* 1-Click Preset Shortcut */}
        <div className="p-4 rounded-xl bg-[#f5e8cc] border border-[#e8d4a8] border-b-2 border-[#d8c292] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-[#4c1d95] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#1c1812]">Want to test without typing?</p>
              <p className="text-[11px] text-[#786e5e]">Autofill with our verified active Aave v3 Arbitrum test position.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUseDemoPreset}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#fef3c7] text-[#4c1d95] border border-[#e8d4a8] border-b-2 border-[#d8c292] text-xs font-bold transition-all shadow-sm shrink-0"
          >
            Autofill Demo
          </button>
        </div>

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Chain Selector Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#1c1812] uppercase tracking-wider mb-2 font-mono">
              Select Blockchain Network
            </label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e8d4a8] text-[#1c1812] text-sm font-semibold focus:outline-none focus:border-[#4c1d95] shadow-sm"
            >
              {CHAINS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Public Wallet Address Input */}
          <div>
            <label className="block text-xs font-semibold text-[#1c1812] uppercase tracking-wider mb-2 font-mono">
              Public Wallet Address (0x...)
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x71C8401344445853782977E2A91D61b9a957B7E6"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e8d4a8] text-[#1c1812] text-xs font-mono focus:outline-none focus:border-[#4c1d95] shadow-sm"
            />
            <p className="text-[11px] text-[#786e5e] mt-1 font-sans">
              Enter any address currently borrowing on Aave, Compound, or Spark.
            </p>
          </div>

          {/* Label / Nickname */}
          <div>
            <label className="block text-xs font-semibold text-[#1c1812] uppercase tracking-wider mb-2 font-mono">
              Position Nickname / Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Primary Arbitrum Vault"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e8d4a8] text-[#1c1812] text-xs focus:outline-none focus:border-[#4c1d95] shadow-sm"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-[#fee2e2] border border-[#fca5a5] text-xs text-[#991515] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#b91c1c]" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Telegram Push Alerts Connector */}
          <div className="pt-1">
            <TelegramConnectCard currentUser={user} />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onSkipToDemo}
              className="text-xs font-semibold text-[#786e5e] hover:text-[#4c1d95] transition-colors underline"
            >
              Skip setup and load live demo
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-3d-royal px-6 py-3 rounded-xl font-bold text-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Position...</span>
                </>
              ) : (
                <>
                  <span>Continue to Dashboard</span>
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