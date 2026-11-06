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
  Check,
  DollarSign,
  TrendingDown,
  Scale,
  Sliders
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

  // Position Parameters (Collateral & Debt numbers)
  const [collateralSymbol, setCollateralSymbol] = useState('ETH');
  const [collateralAmount, setCollateralAmount] = useState('2.5');
  const [collateralPrice, setCollateralPrice] = useState('3000');
  const [collateralUsd, setCollateralUsd] = useState('7500');
  const [debtUsd, setDebtUsd] = useState('4500');
  const [liquidationThreshold, setLiquidationThreshold] = useState('0.825');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleWalletModeChange = (mode) => {
    setWalletMode(mode);
    setError(null);
    if (mode === 'demo') {
      setChain('arbitrum');
      setAddress(DEMO_ADDRESS);
      setLabel('Aave V3 Arbitrum Vault');
      setCollateralSymbol('ETH');
      setCollateralAmount('2.5');
      setCollateralPrice('3000');
      setCollateralUsd('7500');
      setDebtUsd('4500');
    } else {
      setAddress('');
      setLabel('My DeFi Vault');
    }
  };

  const handleAmountOrPriceChange = (newAmount, newPrice) => {
    setCollateralAmount(newAmount);
    setCollateralPrice(newPrice);
    const amt = parseFloat(newAmount) || 0;
    const prc = parseFloat(newPrice) || 0;
    setCollateralUsd((amt * prc).toFixed(2));
  };

  const cVal = parseFloat(collateralUsd) || 0;
  const dVal = parseFloat(debtUsd) || 0;
  const ltVal = parseFloat(liquidationThreshold) || 0.825;
  const previewHf = dVal > 0 ? (cVal * ltVal) / dVal : 999;
  const previewEquity = cVal - dVal;

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

    if (cVal <= 0 || dVal <= 0) {
      setError('Please ensure Collateral and Debt are positive values.');
      return;
    }

    setError(null);
    setLoading(true);

    const userPosition = {
      collateral_usd: cVal,
      debt_usd: dVal,
      collateral_amount: parseFloat(collateralAmount) || 2.5,
      collateral_symbol: collateralSymbol,
      collateral_price: parseFloat(collateralPrice) || 3000,
      protocol: protocol === 'aave_v3' ? 'Aave v3' : protocol === 'compound_v3' ? 'Compound v3' : 'Spark Protocol',
      chain,
      liquidation_threshold: ltVal,
    };

    setTimeout(() => {
      setLoading(false);
      onCompleteOnboarding({
        chain,
        address: cleanAddress,
        label: label.trim() || 'Monitored Vault',
        protocol,
        borrowerName: borrowerName.trim() || user?.email?.split('@')[0] || 'Borrower',
        is_primary: true,
        userPosition,
      });
    }, 300);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-in fade-in duration-300">
      <div className="paper-card rounded-2xl p-6 sm:p-8 space-y-6 border-2 border-black shadow-[6px_6px_0_#000] bg-white">
        {/* Onboarding Header */}
        <div className="border-b-2 border-black pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-black bg-[#fef08a] px-2.5 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
              WORKBENCH SETUP • CONFIGURE POSITION
            </span>
            <span className="text-xs font-mono font-black text-black/70 bg-black/5 px-2 py-0.5 rounded">
              {user?.email || 'Authenticated'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Configure Your Borrowing Position
          </h2>
          <p className="text-xs sm:text-sm text-black/80 mt-1 font-sans font-medium">
            Enter your active loan numbers to customize your risk workbench, and link our Telegram bot for instant liquidation warnings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Borrower Profile */}
          <div className="p-4 rounded-xl bg-[#fffdf5] border-2 border-black shadow-[3px_3px_0_#000] space-y-3.5">
            <div className="flex items-center space-x-2 border-b-2 border-black/10 pb-2">
              <User className="w-4 h-4 text-[#3b82f6]" />
              <h3 className="text-xs font-mono font-black uppercase text-black">
                Step 1: Borrower Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

          {/* SECTION 2: Position Metrics (Collateral, Debt, Health Factor) */}
          <div className="p-4 rounded-xl bg-[#fffdf5] border-2 border-black shadow-[3px_3px_0_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#16a34a]" />
                <h3 className="text-xs font-mono font-black uppercase text-black">
                  Step 2: Position Numbers (Collateral &amp; Debt)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#86efac] text-[#065f46] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
                CUSTOMIZABLE
              </span>
            </div>

            {/* Mode Selector */}
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
                    Aave V3 Preset
                  </span>
                  {walletMode === 'demo' && <Check className="w-3.5 h-3.5 text-black" />}
                </div>
                <p className="text-[11px] text-black/70 mt-1 font-medium">
                  2.5 ETH ($7,500 Collat) / $4,500 Debt
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
                    Custom Position
                  </span>
                  {walletMode === 'custom' && <Check className="w-3.5 h-3.5 text-black" />}
                </div>
                <p className="text-[11px] text-black/70 mt-1 font-medium">
                  Type your own exact Collateral &amp; Debt
                </p>
              </button>
            </div>

            {/* Metric Inputs Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-mono font-black text-black mb-1">
                  Collateral Amount &amp; Token
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="number"
                    step="any"
                    required
                    value={collateralAmount}
                    onChange={(e) => handleAmountOrPriceChange(e.target.value, collateralPrice)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border-2 border-black text-black font-mono font-bold text-xs focus:outline-none"
                  />
                  <select
                    value={collateralSymbol}
                    onChange={(e) => setCollateralSymbol(e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-white border-2 border-black text-black font-mono font-black text-xs"
                  >
                    <option value="ETH">ETH</option>
                    <option value="WBTC">WBTC</option>
                    <option value="SOL">SOL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-black text-black mb-1">
                  Asset Price ($)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={collateralPrice}
                  onChange={(e) => handleAmountOrPriceChange(collateralAmount, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border-2 border-black text-black font-mono font-bold text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-black text-black mb-1">
                  Total Collateral Value ($)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={collateralUsd}
                  onChange={(e) => setCollateralUsd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border-2 border-black text-black font-mono font-black text-xs text-[#16a34a] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-black text-black mb-1">
                  Total Outstanding Debt ($)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={debtUsd}
                  onChange={(e) => setDebtUsd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border-2 border-black text-black font-mono font-black text-xs text-[#dc2626] focus:outline-none"
                />
              </div>
            </div>

            {/* Wallet Address Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t-2 border-black/10">
              <div>
                <label className="block text-[11px] font-mono font-black text-black mb-1">
                  Blockchain Network
                </label>
                <select
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border-2 border-black text-black text-xs font-black focus:outline-none"
                >
                  {CHAINS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-black text-black mb-1">
                  Public Wallet Address (0x...)
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x71C8401344445853782977E2A91D61b9a957B7E6"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border-2 border-black text-black text-xs font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Live Metrics Summary Card */}
            <div className="p-3 rounded-xl bg-[#fef08a] border-2 border-black shadow-[2px_2px_0_#000] grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="block text-[9px] font-mono uppercase font-black text-black/70">
                  Total Collateral
                </span>
                <span className="text-sm font-mono font-black text-black">
                  ${cVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-mono uppercase font-black text-black/70">
                  Total Debt
                </span>
                <span className="text-sm font-mono font-black text-black">
                  ${dVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-mono uppercase font-black text-black/70">
                  Health Factor
                </span>
                <span className="text-sm font-mono font-black text-black">
                  {previewHf > 99 ? '∞' : previewHf.toFixed(2)}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-[#fee2e2] border-2 border-black shadow-[2px_2px_0_#000] text-xs text-[#991515] flex items-center space-x-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626]" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* SECTION 3: Connect Telegram Chatbot (@Bachegafi_bot) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-[#229ED9]" />
                <h3 className="text-xs font-mono font-black uppercase text-black">
                  Step 3: Connect Telegram Risk Bot (@Bachegafi_bot)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-black/60">
                RECOMMENDED
              </span>
            </div>

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
