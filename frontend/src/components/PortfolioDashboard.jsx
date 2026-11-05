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
          <div className="w-10 h-10 border-3 border-terracotta border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-600 font-mono">Syncing on-chain balances & live CoinGecko rates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-300 text-center max-w-xl mx-auto paper-card">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-lg font-heritage font-bold text-slate-900 mb-2">Failed to load portfolio</h3>
          <p className="text-sm text-slate-700 mb-6">{error}</p>
          <button
            onClick={onRefresh}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center space-x-2"
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
        classes: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
      };
    }
    if (hf >= 1.25) {
      return {
        label: 'STABLE',
        classes: 'bg-blue-100 text-blue-900 border-blue-300',
        icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-700" />
      };
    }
    if (hf >= 1.1) {
      return {
        label: 'TENSION',
        classes: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />
      };
    }
    if (hf >= 1.0) {
      return {
        label: 'CRITICAL',
        classes: 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse',
        icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-700" />
      };
    }
    return {
      label: 'LIQUIDATABLE',
      classes: 'bg-red-200 text-red-950 border-red-400 font-bold',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-700" />
    };
  };

  const aggBadge = getRiskBadge(aggregate_health_factor);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heritage font-extrabold text-slate-900 tracking-tight">Portfolio Risk Overview</h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
            <span>Price Feeds:</span>
            <span className="font-mono font-medium text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
              {price_source}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50/60 text-slate-700 border border-amber-900/20 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Rates</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collateral */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Total Collateral Value</span>
            <DollarSign className="w-4 h-4 text-sage" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            ${total_collateral_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-heritage italic">Active across 3 lending protocols</p>
        </div>

        {/* Total Outstanding Debt */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Total Outstanding Debt</span>
            <TrendingDown className="w-4 h-4 text-brass" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            ${total_debt_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-heritage italic">Pegged stablecoin borrows</p>
        </div>

        {/* Net Borrower Equity */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Net Borrower Equity</span>
            <TrendingUp className="w-4 h-4 text-deck" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            ${net_worth_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-heritage italic">Collateral + wallet minus borrows</p>
        </div>

        {/* Aggregate Health Factor */}
        <div className="paper-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Aggregate Health Factor</span>
            <Scale className="w-4 h-4 text-terracotta" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{aggregate_health_factor.toFixed(2)}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border inline-flex items-center ${aggBadge.classes}`}>
              {aggBadge.icon}
              {aggBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-heritage italic">Liquidation boundary is &lt; 1.00</p>
        </div>
      </div>

      {/* Supported Lending Positions Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-heritage font-bold text-slate-900 tracking-tight">Active Lending Positions</h3>
          <p className="text-xs text-slate-500">Read-only risk and liquidation margins per protocol</p>
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
                className="paper-card rounded-2xl p-6 hover:shadow-paper-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-500">{pos.chain}</span>
                      <h4 className="text-lg font-heritage font-bold text-slate-900">{pos.protocol}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-mono border inline-flex items-center ${posBadge.classes}`}>
                      {posBadge.icon}
                      {posBadge.label}
                    </span>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-amber-900/15 mb-4">
                    <div>
                      <span className="text-[11px] text-slate-500">Collateral Value</span>
                      <p className="text-sm font-mono font-semibold text-slate-900">
                        ${pos.collateral_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Borrowed Debt</span>
                      <p className="text-sm font-mono font-semibold text-slate-900">
                        ${pos.debt_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Health Factor</span>
                      <p className="text-base font-mono font-bold text-terracotta">
                        {pos.health_factor.toFixed(3)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Borrow Capacity</span>
                      <p className="text-sm font-mono text-slate-700">
                        ${pos.net_borrow_capacity_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stress test action */}
                <button
                  onClick={() => onSelectPositionForSimulation(posId)}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-amber-50/80 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5 text-terracotta" />
                  <span>Stress Test This Position</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monitored Wallet Spot Balances */}
      <div className="paper-card rounded-2xl p-6">
        <div className="mb-4">
          <h3 className="text-base font-heritage font-bold text-slate-900">Liquid Wallet Assets (Unencumbered)</h3>
          <p className="text-xs text-slate-500">Available reserves that can be deposited to bolster collateral buffers</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-amber-900/15">
              <tr>
                <th className="pb-3 font-semibold font-mono">Asset</th>
                <th className="pb-3 font-semibold font-mono">Chain</th>
                <th className="pb-3 font-semibold font-mono">Holding</th>
                <th className="pb-3 font-semibold font-mono">CoinGecko Price</th>
                <th className="pb-3 font-semibold font-mono">24h Change</th>
                <th className="pb-3 font-semibold font-mono text-right">Value (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 font-mono text-xs">
              {wallet_assets.map((asset, i) => (
                <tr key={i} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900 flex items-center space-x-2 font-sans">
                    <span className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-mono font-bold text-xs text-amber-900">
                      {asset.symbol.slice(0, 1)}
                    </span>
                    <span>{asset.name}</span>
                    <span className="text-slate-400 text-xs">({asset.symbol})</span>
                  </td>
                  <td className="py-3.5 text-slate-600 capitalize font-sans">{asset.chain}</td>
                  <td className="py-3.5 text-slate-800">{asset.amount.toLocaleString()} {asset.symbol}</td>
                  <td className="py-3.5 text-slate-800">${asset.usd_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`py-3.5 font-semibold ${asset.price_24h_change_pct >= 0 ? 'text-sage' : 'text-carmine'}`}>
                    {asset.price_24h_change_pct >= 0 ? '+' : ''}{asset.price_24h_change_pct.toFixed(2)}%
                  </td>
                  <td className="py-3.5 text-right font-bold text-slate-900">
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
