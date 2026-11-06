import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Scale,
  RefreshCw,
  Sliders,
  DollarSign,
  Send,
  ExternalLink,
  Edit3,
  Check,
  Layers,
  Sparkles
} from 'lucide-react';

const PROTOCOL_PRESETS = {
  aave_eth: {
    label: 'Aave V3 (ETH / USDC)',
    collatUsd: 7500.0,
    debtUsd: 4500.0,
    symbol: 'ETH',
    amount: 2.5,
    price: 3000.0,
    protocol: 'Aave v3',
    chain: 'Arbitrum',
    lt: 0.825,
  },
  aave_wbtc: {
    label: 'Aave V3 (WBTC / USDT)',
    collatUsd: 9750.0,
    debtUsd: 7000.0,
    symbol: 'WBTC',
    amount: 0.15,
    price: 65000.0,
    protocol: 'Aave v3',
    chain: 'Arbitrum',
    lt: 0.780,
  },
  demo_fleet: {
    label: 'Demo Fleet (3 Protocols)',
    collatUsd: 176425.0,
    debtUsd: 95500.0,
    symbol: 'ETH',
    amount: 54.28,
    price: 3250.0,
    protocol: 'Aave v3',
    chain: 'Ethereum',
    lt: 0.812,
  },
};

export default function PortfolioDashboard({
  portfolio,
  loading,
  error,
  onRefresh,
  onSelectPositionForSimulation,
  onOpenTelegramModal,
  customPosition,
  onUpdateCustomPosition,
}) {
  const [telegramConnected, setTelegramConnected] = useState(
    () => localStorage.getItem('bachega_telegram_verified') === 'true'
  );
  const [telegramUsername, setTelegramUsername] = useState(
    () => localStorage.getItem('bachega_telegram_username') || ''
  );

  // Position Configuration State
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [activePreset, setActivePreset] = useState('custom');
  const [inputCollat, setInputCollat] = useState(() => {
    return customPosition?.collateral_usd?.toString() || '7500';
  });
  const [inputDebt, setInputDebt] = useState(() => {
    return customPosition?.debt_usd?.toString() || '4500';
  });
  const [inputLt, setInputLt] = useState(() => {
    return customPosition?.liquidation_threshold?.toString() || '0.825';
  });
  const [inputSymbol, setInputSymbol] = useState(() => {
    return customPosition?.collateral_symbol || 'ETH';
  });

  useEffect(() => {
    if (customPosition) {
      setInputCollat(customPosition.collateral_usd?.toString() || '7500');
      setInputDebt(customPosition.debt_usd?.toString() || '4500');
      setInputLt(customPosition.liquidation_threshold?.toString() || '0.825');
      setInputSymbol(customPosition.collateral_symbol || 'ETH');
    }
  }, [customPosition]);

  useEffect(() => {
    const checkTelegram = () => {
      setTelegramConnected(localStorage.getItem('bachega_telegram_verified') === 'true');
      setTelegramUsername(localStorage.getItem('bachega_telegram_username') || '');
    };
    window.addEventListener('storage', checkTelegram);
    const interval = setInterval(checkTelegram, 2500);
    return () => {
      window.removeEventListener('storage', checkTelegram);
      clearInterval(interval);
    };
  }, []);

  if (loading && !portfolio) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
          <div className="w-10 h-10 border-4 border-[#4c1d95] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#443a2b] font-mono">Syncing on-chain balances &amp; live CoinGecko rates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-8 rounded-2xl bg-[#fee2e2] border-2 border-[#fca5a5] text-center max-w-xl mx-auto paper-card">
          <AlertTriangle className="w-10 h-10 text-[#b91c1c] mx-auto mb-3" />
          <h3 className="text-lg font-heritage font-black text-[#1c1812] mb-2">Failed to load portfolio</h3>
          <p className="text-sm text-[#443a2b] mb-6">{error}</p>
          <button
            onClick={onRefresh}
            className="btn-3d-royal px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Metrics: Prefer customPosition if configured, otherwise fallback to portfolio
  const effectiveCollat = customPosition?.collateral_usd !== undefined
    ? Number(customPosition.collateral_usd)
    : (portfolio?.total_collateral_usd || 176425.0);

  const effectiveDebt = customPosition?.debt_usd !== undefined
    ? Number(customPosition.debt_usd)
    : (portfolio?.total_debt_usd || 95500.0);

  const effectiveLt = customPosition?.liquidation_threshold !== undefined
    ? Number(customPosition.liquidation_threshold)
    : 0.812;

  const effectiveNetWorth = effectiveCollat - effectiveDebt;
  const effectiveHf = effectiveDebt > 0 ? (effectiveCollat * effectiveLt) / effectiveDebt : 999.0;
  const price_source = portfolio?.price_source || 'CoinGecko API (live/cached) + Alchemy Node';

  const handleApplyPreset = (key) => {
    setActivePreset(key);
    const p = PROTOCOL_PRESETS[key];
    if (p && onUpdateCustomPosition) {
      setInputCollat(p.collatUsd.toString());
      setInputDebt(p.debtUsd.toString());
      setInputLt(p.lt.toString());
      setInputSymbol(p.symbol);
      onUpdateCustomPosition({
        collateral_usd: p.collatUsd,
        debt_usd: p.debtUsd,
        collateral_symbol: p.symbol,
        collateral_amount: p.amount,
        collateral_price: p.price,
        protocol: p.protocol,
        chain: p.chain,
        liquidation_threshold: p.lt,
      });
    }
  };

  const handleSaveCustomMetrics = (e) => {
    e.preventDefault();
    const c = parseFloat(inputCollat) || 0;
    const d = parseFloat(inputDebt) || 0;
    const lt = parseFloat(inputLt) || 0.825;

    if (c <= 0 || d <= 0) return;

    if (onUpdateCustomPosition) {
      onUpdateCustomPosition({
        collateral_usd: c,
        debt_usd: d,
        collateral_symbol: inputSymbol,
        collateral_amount: inputSymbol === 'ETH' ? c / 3000 : inputSymbol === 'WBTC' ? c / 65000 : c / 180,
        collateral_price: inputSymbol === 'ETH' ? 3000 : inputSymbol === 'WBTC' ? 65000 : 180,
        protocol: 'Aave v3',
        chain: 'Arbitrum',
        liquidation_threshold: lt,
      });
    }
    setIsEditingPosition(false);
  };

  const getRiskBadge = (hf) => {
    if (hf >= 1.5) {
      return {
        label: 'EQUILIBRIUM',
        classes: 'bg-[#86efac] text-[#065f46] border-2 border-black font-black shadow-[2px_2px_0_#000]',
        icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#065f46]" />
      };
    }
    if (hf >= 1.25) {
      return {
        label: 'STABLE',
        classes: 'bg-[#93c5fd] text-[#1e3a8a] border-2 border-black font-black shadow-[2px_2px_0_#000]',
        icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#1e3a8a]" />
      };
    }
    if (hf >= 1.1) {
      return {
        label: 'TENSION',
        classes: 'bg-[#fef08a] text-[#854d0e] border-2 border-black font-black shadow-[2px_2px_0_#000]',
        icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#854d0e]" />
      };
    }
    if (hf >= 1.0) {
      return {
        label: 'CRITICAL',
        classes: 'bg-[#fca5a5] text-[#991b1b] border-2 border-black font-black shadow-[2px_2px_0_#000] animate-pulse',
        icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#991b1b]" />
      };
    }
    return {
      label: 'LIQUIDATABLE',
      classes: 'bg-[#ef4444] text-white border-2 border-black font-black shadow-[2px_2px_0_#000]',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-white" />
    };
  };

  const aggBadge = getRiskBadge(effectiveHf);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight">Portfolio Risk Overview</h2>
          <p className="text-xs text-black/70 mt-1 flex items-center space-x-2 font-medium">
            <span>Price Feeds:</span>
            <span className="font-mono font-black text-black bg-[#fef08a] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
              {price_source}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsEditingPosition((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-[#fef08a] hover:bg-[#fde047] text-black border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px] text-xs font-black flex items-center space-x-1.5 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingPosition ? 'Hide Editor' : 'Edit Position Numbers ($)'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#fef08a] text-black border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px] text-xs font-black flex items-center space-x-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#2563eb] ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Rates</span>
          </button>
        </div>
      </div>

      {/* Interactive Position Editor Bar (When Opened) */}
      {isEditingPosition && (
        <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0_#000] space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/10 pb-2">
            <span className="text-xs font-mono font-black uppercase text-black flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#3b82f6]" />
              Adjust Position Metrics (Changes reflect immediately below)
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('aave_eth')}
                className="px-2 py-0.5 text-[10px] font-mono font-black bg-white hover:bg-[#fef08a] border border-black rounded shadow-[1px_1px_0_#000]"
              >
                Aave ETH ($7.5k / $4.5k)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('aave_wbtc')}
                className="px-2 py-0.5 text-[10px] font-mono font-black bg-white hover:bg-[#fef08a] border border-black rounded shadow-[1px_1px_0_#000]"
              >
                Aave WBTC ($9.7k / $7k)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('demo_fleet')}
                className="px-2 py-0.5 text-[10px] font-mono font-black bg-white hover:bg-[#fef08a] border border-black rounded shadow-[1px_1px_0_#000]"
              >
                Original Fleet ($176k / $95k)
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveCustomMetrics} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-mono font-black text-black mb-1">
                Total Collateral ($)
              </label>
              <input
                type="number"
                step="any"
                required
                value={inputCollat}
                onChange={(e) => setInputCollat(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border-2 border-black text-black font-mono font-black text-xs text-[#16a34a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-black mb-1">
                Total Debt ($)
              </label>
              <input
                type="number"
                step="any"
                required
                value={inputDebt}
                onChange={(e) => setInputDebt(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border-2 border-black text-black font-mono font-black text-xs text-[#dc2626] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-black mb-1">
                Liquidation Threshold (LT)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.5"
                max="0.99"
                required
                value={inputLt}
                onChange={(e) => setInputLt(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border-2 border-black text-black font-mono font-black text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="btn-3d-royal py-2 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Update Metrics</span>
            </button>
          </form>
        </div>
      )}

      {/* 4 Summary Cards (Exact match to screenshot, dynamically bound!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collateral */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div className="flex items-center justify-between text-xs text-black/70 mb-2 font-black uppercase tracking-wider font-mono">
            <span>Total Collateral Value</span>
            <DollarSign className="w-4 h-4 text-[#16a34a]" />
          </div>
          <div className="text-2xl font-black font-mono text-black">
            ${effectiveCollat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-black/60 mt-2 font-bold font-mono">
            {customPosition?.collateral_amount ? `${customPosition.collateral_amount} ${customPosition.collateral_symbol || 'ETH'}` : 'Active borrowing position'}
          </p>
        </div>

        {/* Total Outstanding Debt */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div className="flex items-center justify-between text-xs text-black/70 mb-2 font-black uppercase tracking-wider font-mono">
            <span>Total Outstanding Debt</span>
            <TrendingDown className="w-4 h-4 text-[#dc2626]" />
          </div>
          <div className="text-2xl font-black font-mono text-black">
            ${effectiveDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-black/60 mt-2 font-bold font-mono">Pegged stablecoin borrows</p>
        </div>

        {/* Net Borrower Equity */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div className="flex items-center justify-between text-xs text-black/70 mb-2 font-black uppercase tracking-wider font-mono">
            <span>Net Borrower Equity</span>
            <TrendingUp className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="text-2xl font-black font-mono text-black">
            ${effectiveNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-black/60 mt-2 font-bold font-mono">Collateral minus borrows</p>
        </div>

        {/* Aggregate Health Factor */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div className="flex items-center justify-between text-xs text-black/70 mb-2 font-black uppercase tracking-wider font-mono">
            <span>Aggregate Health Factor</span>
            <Scale className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black font-mono text-black">
              {effectiveHf > 99 ? '∞' : effectiveHf.toFixed(2)}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border-2 border-black inline-flex items-center ${aggBadge.classes}`}>
              {aggBadge.icon}
              {aggBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-black/60 mt-2 font-bold font-mono">Liquidation boundary is &lt; 1.00</p>
        </div>
      </div>

      {/* High-Impact Telegram Bot Integration Banner */}
      <div className="paper-card rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0_#000] bg-[#fef08a] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shrink-0 border-2 border-black shadow-[2px_2px_0_#000]">
            <Send className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-black">
                Telegram Risk Assistant &amp; Push Alerts (@Bachega_bot)
              </h3>
              {telegramConnected ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#86efac] text-[#065f46] border border-black shadow-[1px_1px_0_#000]">
                  ACTIVE: @{telegramUsername || 'connected'} ✓
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#fee2e2] text-[#991515] border border-black shadow-[1px_1px_0_#000]">
                  NOT CONNECTED
                </span>
              )}
            </div>
            <p className="text-xs text-black/80 font-sans font-medium mt-1">
              Ask anything in natural language (e.g. <span className="font-mono font-bold bg-white/80 px-1.5 py-0.5 rounded border border-black/20 text-black">"Simulate 35% crash"</span> or <span className="font-mono font-bold bg-white/80 px-1.5 py-0.5 rounded border border-black/20 text-black">"How much debt should I repay?"</span>) and get instant liquidation push warnings on your phone.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenTelegramModal}
            className="btn-3d-royal px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{telegramConnected ? 'Manage Bot / Send Test Alert' : 'Connect @Bachega_bot'}</span>
          </button>
        </div>
      </div>

      {/* Supported Lending Positions Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black text-black tracking-tight">Active Lending Positions</h3>
          <p className="text-xs text-black/70 font-medium">Read-only risk and liquidation margins per protocol</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* If custom position is set, prioritize user's configured position */}
          {customPosition ? (
            <div className="paper-card rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0_#000] bg-white hover:shadow-[5px_5px_0_#000] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-black/70 font-bold">
                      {customPosition.chain || 'Arbitrum'}
                    </span>
                    <h4 className="text-lg font-black text-black">{customPosition.protocol || 'Aave v3'}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono border-2 border-black inline-flex items-center ${aggBadge.classes}`}>
                    {aggBadge.icon}
                    {aggBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y-2 border-black mb-4">
                  <div>
                    <span className="text-[11px] text-black/70 font-mono font-bold">Collateral Value</span>
                    <p className="text-sm font-mono font-black text-black">
                      ${effectiveCollat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-black/70 font-mono font-bold">Total Debt</span>
                    <p className="text-sm font-mono font-black text-black">
                      ${effectiveDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-black/70 font-mono font-bold">Health Factor</span>
                    <p className="text-base font-mono font-black text-[#2563eb]">
                      {effectiveHf > 99 ? '∞' : effectiveHf.toFixed(3)}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-black/70 font-mono font-bold">Net Equity</span>
                    <p className="text-sm font-mono font-black text-black">
                      ${effectiveNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectPositionForSimulation('pos_aave_v3_eth')}
                className="w-full btn-3d-royal py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulate Flash Crash Shock</span>
              </button>
            </div>
          ) : null}

          {/* Additional / Default Protocol Cards */}
          {(portfolio?.lending_summaries || []).map((pos, idx) => {
            const posBadge = getRiskBadge(pos.health_factor);
            const positionIdMap = {
              'Aave v3': 'pos_aave_v3_eth',
              'Compound v3': 'pos_comp_v3_arb',
              'Spark Protocol': 'pos_spark_eth',
            };
            const posId = positionIdMap[pos.protocol] || 'pos_aave_v3_eth';

            return (
              <div
                key={idx}
                className="paper-card rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0_#000] bg-white hover:shadow-[5px_5px_0_#000] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-black/70 font-bold">{pos.chain}</span>
                      <h4 className="text-lg font-black text-black">{pos.protocol}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-mono border-2 border-black inline-flex items-center ${posBadge.classes}`}>
                      {posBadge.icon}
                      {posBadge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y-2 border-black mb-4">
                    <div>
                      <span className="text-[11px] text-black/70 font-mono font-bold">Collateral Value</span>
                      <p className="text-sm font-mono font-black text-black">
                        ${pos.collateral_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] text-black/70 font-mono font-bold">Total Debt</span>
                      <p className="text-sm font-mono font-black text-black">
                        ${pos.debt_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] text-black/70 font-mono font-bold">Health Factor</span>
                      <p className="text-base font-mono font-black text-[#2563eb]">
                        {pos.health_factor.toFixed(3)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] text-black/70 font-mono font-bold">Net Equity</span>
                      <p className="text-sm font-mono font-black text-black">
                        ${(pos.collateral_usd - pos.debt_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectPositionForSimulation(posId)}
                  className="w-full btn-3d-royal py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Simulate Flash Crash Shock</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
