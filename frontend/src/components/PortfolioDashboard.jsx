import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Scale,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function PortfolioDashboard({
  portfolio,
  loading,
  error,
  onRefresh,
  onSelectPositionForSimulation
}) {
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

  const {
    total_collateral_usd = 0,
    total_debt_usd = 0,
    net_worth_usd = 0,
    aggregate_health_factor = 0,
    lending_summaries = [],
    wallet_assets = [],
    price_source = 'Live CoinGecko + Alchemy'
  } = portfolio || {};

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

  const aggBadge = getRiskBadge(aggregate_health_factor);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
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

        <div className="flex items-center space-x-3">
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

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collateral */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div className="flex items-center justify-between text-xs text-black/70 mb-2 font-black uppercase tracking-wider font-mono">
            <span>Total Collateral Value</span>
            <DollarSign className="w-4 h-4 text-[#16a34a]" />
          </div>
          <div className="text-2xl font-black font-mono text-black">
            ${total_collateral_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-black/60 mt-2 font-bold">Active across 3 lending protocols</p>
        </div>

        {/* Total Outstanding Debt */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div className="flex items-center justify-between text-xs text-black/70 mb-2 font-black uppercase tracking-wider font-mono">
            <span>Total Outstanding Debt</span>
            <TrendingDown className="w-4 h-4 text-[#dc2626]" />
          </div>
          <div className="text-2xl font-black font-mono text-black">
            ${total_debt_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-black/60 mt-2 font-bold">Pegged stablecoin borrows</p>
        </div>

        {/* Net Borrower Equity */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div className="flex items-center justify-between text-xs text-black/70 mb-2 font-black uppercase tracking-wider font-mono">
            <span>Net Borrower Equity</span>
            <TrendingUp className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="text-2xl font-black font-mono text-black">
            ${net_worth_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-black/60 mt-2 font-bold">Collateral + wallet minus borrows</p>
        </div>

        {/* Aggregate Health Factor */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div className="flex items-center justify-between text-xs text-black/70 mb-2 font-black uppercase tracking-wider font-mono">
            <span>Aggregate Health Factor</span>
            <Scale className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black font-mono text-black">{aggregate_health_factor.toFixed(2)}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border-2 border-black inline-flex items-center ${aggBadge.classes}`}>
              {aggBadge.icon}
              {aggBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-black/60 mt-2 font-bold">Liquidation boundary is &lt; 1.00</p>
        </div>
      </div>

      {/* Supported Lending Positions Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black text-black tracking-tight">Active Lending Positions</h3>
          <p className="text-xs text-black/70 font-medium">Read-only risk and liquidation margins per protocol</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {lending_summaries.map((pos, idx) => {
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

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y-2 border-black mb-4">
                    <div>
                      <span className="text-[11px] text-black/70 font-mono font-bold">Collateral Value</span>
                      <p className="text-sm font-mono font-black text-black">
                        ${pos.collateral_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-black/70 font-mono font-bold">Borrowed Debt</span>
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
                      <span className="text-[11px] text-black/70 font-mono font-bold">Borrow Capacity</span>
                      <p className="text-sm font-mono font-bold text-black/80">
                        ${pos.net_borrow_capacity_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stress test action */}
                <button
                  onClick={() => onSelectPositionForSimulation(posId)}
                  className="w-full mt-2 btn-3d-royal py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2"
                >
                  <Sliders className="w-3.5 h-3.5 text-white" />
                  <span>Stress Test This Position</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monitored Wallet Spot Balances */}
      <div className="paper-card rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0_#000] bg-white">
        <div className="mb-4">
          <h3 className="text-base font-black text-black">Liquid Wallet Assets (Unencumbered)</h3>
          <p className="text-xs text-black/70 font-medium">Available reserves that can be deposited to bolster collateral buffers</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] text-black uppercase tracking-wider border-b-2 border-black">
              <tr>
                <th className="pb-3 font-black font-mono">Asset</th>
                <th className="pb-3 font-black font-mono">Chain</th>
                <th className="pb-3 font-black font-mono">Holding</th>
                <th className="pb-3 font-black font-mono">CoinGecko Price</th>
                <th className="pb-3 font-black font-mono">24h Change</th>
                <th className="pb-3 font-black font-mono text-right">Value (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 border-b-2 border-black divide-black/20 font-mono text-xs">
              {wallet_assets.map((asset, i) => (
                <tr key={i} className="hover:bg-[#fef08a]/30 transition-colors">
                  <td className="py-3.5 font-bold text-black flex items-center space-x-2 font-sans">
                    <span className="w-7 h-7 rounded-lg bg-[#fef08a] border-2 border-black flex items-center justify-center font-mono font-black text-xs text-black shadow-[1px_1px_0_#000]">
                      {asset.symbol.slice(0, 1)}
                    </span>
                    <span className="font-black">{asset.name}</span>
                    <span className="text-black/60 text-xs font-bold">({asset.symbol})</span>
                  </td>
                  <td className="py-3.5 text-black/80 capitalize font-sans font-medium">{asset.chain}</td>
                  <td className="py-3.5 text-black font-bold">{asset.amount.toLocaleString()} {asset.symbol}</td>
                  <td className="py-3.5 text-black font-bold">${asset.usd_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`py-3.5 font-black ${asset.price_24h_change_pct >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                    {asset.price_24h_change_pct >= 0 ? '+' : ''}{asset.price_24h_change_pct.toFixed(2)}%
                  </td>
                  <td className="py-3.5 text-right font-black text-black">
                    ${asset.usd_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}