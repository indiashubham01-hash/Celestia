import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  ArrowRightLeft,
  Coins,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Scale,
  Zap,
  TrendingDown,
  Lock,
  Sliders,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';

/**
 * Bachega.fi — Comprehensive 5-Strategy DeFi Risk & Rescue Workbench
 * Pure deterministic smart contract mathematics:
 * 1. Do Nothing (Passive under crash)
 * 2. Repay Debt (External capital de-leveraging)
 * 3. Add Collateral (External capital buffer)
 * 4. Collateral Swap (Zero-capital: volatile -> stablecoin LT=0.90)
 * 5. Partial Deleverage (Zero-capital: self-rescue auto-sell to target HF=1.10)
 */
export default function Dashboard() {
  // Input parameters (Defaults: Aave V3 Arbitrum baseline)
  const [collateralAmount, setCollateralAmount] = useState(2.5);
  const [collateralPriceUsd, setCollateralPriceUsd] = useState(3000.0);
  const [debtUsd, setDebtUsd] = useState(4500.0);
  const [liquidationThreshold, setLiquidationThreshold] = useState(0.825); // 82.5% for ETH
  const [priceShockPct, setPriceShockPct] = useState(-35.0);
  const [rescueBudgetUsd, setRescueBudgetUsd] = useState(750.0);
  const [stableLt, setStableLt] = useState(0.90); // 90% for USDC
  const [targetHf, setTargetHf] = useState(1.10);

  const [backendSyncStatus, setBackendSyncStatus] = useState('SYNCED');

  // Pure deterministic mathematical evaluation
  const math = useMemo(() => {
    const c0 = collateralAmount * collateralPriceUsd;
    const hf0 = debtUsd > 0 ? (c0 * liquidationThreshold) / debtUsd : 999.0;
    const denomLiq = collateralAmount * liquidationThreshold;
    const pLiq = denomLiq > 0 ? debtUsd / denomLiq : 0.0;
    const bufferPct = hf0 > 0 ? (1.0 - 1.0 / hf0) * 100.0 : 0.0;

    const pShock = collateralPriceUsd * (1.0 + priceShockPct / 100.0);
    const shockedCollateralUsd = collateralAmount * pShock;

    // Strategy 1: Do Nothing
    const hfDoNothing = debtUsd > 0 ? (shockedCollateralUsd * liquidationThreshold) / debtUsd : 999.0;
    const isLiquidated = hfDoNothing < 1.0;
    const ltvDoNothing = shockedCollateralUsd > 0 ? (debtUsd / shockedCollateralUsd) * 100.0 : 0.0;

    // Strategy 2: Repay Debt
    const newDebt = Math.max(debtUsd - rescueBudgetUsd, 1.0);
    const hfRepay = (shockedCollateralUsd * liquidationThreshold) / newDebt;

    // Strategy 3: Add Collateral
    const newCollateralUsd = shockedCollateralUsd + rescueBudgetUsd;
    const hfAdd = debtUsd > 0 ? (newCollateralUsd * liquidationThreshold) / debtUsd : 999.0;

    // Strategy 4: Collateral Swap (Zero external capital: swaps to stablecoin LT = 0.90)
    const hfSwap = debtUsd > 0 ? (shockedCollateralUsd * stableLt) / debtUsd : 999.0;

    // Strategy 5: Partial Deleverage (Zero external capital: self-rescue via collateral auto-liquidation)
    const denomDel = targetHf - liquidationThreshold;
    let deltaSold = denomDel > 0 ? (targetHf * debtUsd - shockedCollateralUsd * liquidationThreshold) / denomDel : 0.0;
    deltaSold = Math.max(0.0, Math.min(deltaSold, shockedCollateralUsd));
    const remDebt = Math.max(1.0, debtUsd - deltaSold);
    const remCol = Math.max(0.0, shockedCollateralUsd - deltaSold);
    const hfDeleverage = (remCol * liquidationThreshold) / remDebt;

    return {
      c0,
      hf0,
      pLiq,
      bufferPct,
      pShock,
      shockedCollateralUsd,
      isLiquidated,
      ltvDoNothing,
      doNothing: {
        hf: hfDoNothing,
        isLiquidated,
        capitalRequired: 0,
      },
      repayDebt: {
        hf: hfRepay,
        newDebt,
        capitalRequired: rescueBudgetUsd,
        isLiquidated: hfRepay < 1.0,
      },
      addCollateral: {
        hf: hfAdd,
        newCollateralUsd,
        capitalRequired: rescueBudgetUsd,
        isLiquidated: hfAdd < 1.0,
      },
      collateralSwap: {
        hf: hfSwap,
        capitalRequired: 0,
        isLiquidated: hfSwap < 1.0,
        boostLt: stableLt,
      },
      partialDeleverage: {
        hf: hfDeleverage,
        deltaSold,
        remDebt,
        remCol,
        capitalRequired: 0,
        isLiquidated: hfDeleverage < 1.0,
      },
    };
  }, [
    collateralAmount,
    collateralPriceUsd,
    debtUsd,
    liquidationThreshold,
    priceShockPct,
    rescueBudgetUsd,
    stableLt,
    targetHf,
  ]);

  // Sync with backend API
  useEffect(() => {
    let isSubscribed = true;
    async function syncSimulation() {
      try {
        setBackendSyncStatus('SYNCING');
        await api.runSimulation({
          collateral_amount: collateralAmount,
          collateral_price_usd: collateralPriceUsd,
          debt_usd: debtUsd,
          liquidation_threshold: liquidationThreshold,
          price_shock_pct: priceShockPct,
          rescue_budget_usd: rescueBudgetUsd,
          stable_lt: stableLt,
          target_hf: targetHf,
        });
        if (isSubscribed) setBackendSyncStatus('SYNCED');
      } catch (e) {
        if (isSubscribed) setBackendSyncStatus('LOCAL_MATH_ACTIVE');
      }
    }
    const timer = setTimeout(syncSimulation, 300);
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [
    collateralAmount,
    collateralPriceUsd,
    debtUsd,
    liquidationThreshold,
    priceShockPct,
    rescueBudgetUsd,
    stableLt,
    targetHf,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="paper-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-[#e8d4a8]">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-ping"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#4c1d95] font-black">
              Bachega 5-Strategy Mathematical Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heritage font-black text-[#1c1812] tracking-tight">
            DeFi Liquidation Defense Workbench
          </h1>
          <p className="text-xs text-[#5c503e] mt-1 font-sans">
            Evaluate exact deterministic smart contract math across 5 comprehensive rescue paths under instantaneous market shocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#f5e8cc] border border-[#e8d4a8] shadow-sm flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-[#4c1d95]" />
            <span className="text-[11px] font-mono font-bold text-[#1c1812]">100% Read-Only</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#ede9fe] border border-[#c4b5fd] shadow-sm flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-[#6d28d9]" />
            <span className="text-[11px] font-mono font-bold text-[#6d28d9]">
              {backendSyncStatus === 'SYNCED' ? 'Backend Connected' : 'Pure Math Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* Position Baseline & Sensitivity Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="paper-card p-4 rounded-xl">
          <span className="text-[11px] font-mono text-[#786e5e] uppercase">Current Health Factor</span>
          <div className="text-2xl font-heritage font-black text-[#1c1812] mt-1">
            {math.hf0.toFixed(3)}
          </div>
          <span className="text-[10px] font-mono text-[#15803d] font-bold">● Normal Equilibrium</span>
        </div>

        <div className="paper-card p-4 rounded-xl">
          <span className="text-[11px] font-mono text-[#786e5e] uppercase">Liquidation Price (P_liq)</span>
          <div className="text-2xl font-heritage font-black text-[#b91c1c] mt-1">
            ${math.pLiq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] font-mono text-[#786e5e]">At HF = 1.000 Boundary</span>
        </div>

        <div className="paper-card p-4 rounded-xl">
          <span className="text-[11px] font-mono text-[#786e5e] uppercase">Crash Buffer Room</span>
          <div className="text-2xl font-heritage font-black text-[#4c1d95] mt-1">
            {math.bufferPct.toFixed(1)}%
          </div>
          <span className="text-[10px] font-mono text-[#786e5e]">Max Drop Before Default</span>
        </div>

        <div className="paper-card p-4 rounded-xl">
          <span className="text-[11px] font-mono text-[#786e5e] uppercase">Shocked Collateral</span>
          <div className="text-2xl font-heritage font-black text-[#b45309] mt-1">
            ${math.shockedCollateralUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] font-mono text-[#786e5e]">Spot: ${math.pShock.toFixed(0)}</span>
        </div>
      </div>

      {/* Interactive Controls Panel */}
      <div className="paper-card p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8d4a8] pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#4c1d95]" />
            <h2 className="text-base font-heritage font-black text-[#1c1812]">Simulation Stress Parameters</h2>
          </div>
          <div className="flex items-center space-x-2">
            {[-15, -25, -35, -50].map((preset) => (
              <button
                key={preset}
                onClick={() => setPriceShockPct(preset)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  priceShockPct === preset
                    ? 'btn-3d-royal shadow-sm'
                    : 'bg-[#f5e8cc] text-[#1c1812] border border-[#e8d4a8] hover:bg-white'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Shock Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#5c503e] font-bold">ETH Market Drop Shock</span>
              <span className="text-sm font-black text-[#b91c1c]">{priceShockPct}% Crash</span>
            </div>
            <input
              type="range"
              min="-50"
              max="-10"
              step="5"
              value={priceShockPct}
              onChange={(e) => setPriceShockPct(Number(e.target.value))}
              className="w-full h-2.5 bg-[#f5e8cc] rounded-lg appearance-none cursor-pointer accent-[#4c1d95]"
            />
          </div>

          {/* Rescue Budget Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#5c503e] font-bold">External Rescue Budget</span>
              <span className="text-sm font-black text-[#4c1d95]">${rescueBudgetUsd.toLocaleString()} USD</span>
            </div>
            <input
              type="range"
              min="250"
              max="2500"
              step="50"
              value={rescueBudgetUsd}
              onChange={(e) => setRescueBudgetUsd(Number(e.target.value))}
              className="w-full h-2.5 bg-[#f5e8cc] rounded-lg appearance-none cursor-pointer accent-[#4c1d95]"
            />
          </div>

          {/* Quick Input Toggle */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#5c503e] font-bold">Vault Position (Aave V3)</span>
              <span className="text-xs font-mono text-[#786e5e]">2.5 ETH @ $3,000 | $4,500 Debt</span>
            </div>
            <div className="p-2 rounded-xl bg-[#f5e8cc] border border-[#e8d4a8] text-[11px] font-mono text-[#443a2b] flex justify-between">
              <span>Threshold: 82.5%</span>
              <span>Target HF: {targetHf.toFixed(2)}</span>
              <span>Stable LT: {(stableLt * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 COMPREHENSIVE STRATEGIES GRID */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-[#4c1d95]" />
            <h2 className="text-xl font-heritage font-black text-[#1c1812]">
              5 Evaluated Defense Strategies at {priceShockPct}% Shock
            </h2>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="flex items-center space-x-1.5 text-[#059669] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
              <span>Zero-Capital Rescue</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[#4338ca] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></span>
              <span>Capital-Required Rescue</span>
            </span>
          </div>
        </div>

        {/* Responsive 5-Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* 1. DO NOTHING */}
          <div className={`p-5 rounded-2xl flex flex-col justify-between paper-card transition-all ${
            math.doNothing.isLiquidated
              ? 'border-2 border-[#fca5a5] bg-[#fff5f5] shadow-[0_4px_16px_rgba(239,68,68,0.15)]'
              : 'border border-[#e8d4a8] bg-white'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#786e5e]">
                  Strategy 1
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${
                  math.doNothing.isLiquidated
                    ? 'bg-[#fee2e2] text-[#991515] border-[#fca5a5] animate-pulse'
                    : 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                }`}>
                  {math.doNothing.isLiquidated ? 'LIQUIDATED' : 'AT RISK'}
                </span>
              </div>

              <h3 className="text-base font-heritage font-black text-[#1c1812] mb-1">
                Do Nothing
              </h3>
              <p className="text-[11px] text-[#5c503e] mb-4 font-sans leading-relaxed">
                Passive observation. Incur complete unmitigated price shock with zero intervention.
              </p>

              <div className="p-3 rounded-xl bg-[#f5e8cc]/60 border border-[#e8d4a8] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-[#786e5e]">Resulting HF:</span>
                  <span className={`font-bold ${math.doNothing.isLiquidated ? 'text-[#b91c1c]' : 'text-[#1c1812]'}`}>
                    {math.doNothing.hf.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786e5e]">Simulated LTV:</span>
                  <span className="text-[#1c1812]">{math.ltvDoNothing.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786e5e]">Capital Needed:</span>
                  <span className="font-bold text-[#15803d]">$0.00</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#e8d4a8] text-[11px] text-[#786e5e]">
              {math.doNothing.isLiquidated ? (
                <span className="text-[#b91c1c] font-bold">⚠️ Liquidation bot trigger expected</span>
              ) : (
                <span>Buffer remains thin</span>
              )}
            </div>
          </div>

          {/* 2. REPAY DEBT ($750) */}
          <div className="p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-[#c7d2fe] bg-[#f8faff] shadow-[0_4px_16px_rgba(99,102,241,0.08)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4338ca]">
                  Strategy 2
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e0e7ff] text-[#3730a3] border border-[#c7d2fe]">
                  Requires ${rescueBudgetUsd}
                </span>
              </div>

              <h3 className="text-base font-heritage font-black text-[#1e1b4b] mb-1">
                Repay Debt
              </h3>
              <p className="text-[11px] text-[#475569] mb-4 font-sans leading-relaxed">
                De-leverage outstanding debt with external cash to lower denominator in HF formula.
              </p>

              <div className="p-3 rounded-xl bg-white border border-[#c7d2fe] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Restored HF:</span>
                  <span className="font-bold text-[#4338ca] text-sm">
                    {math.repayDebt.hf.toFixed(3)} {math.repayDebt.hf >= 1.0 ? '✅' : '⚠️'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">New Debt:</span>
                  <span className="text-[#1e293b]">${math.repayDebt.newDebt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Capital Cash:</span>
                  <span className="font-bold text-[#4338ca]">${rescueBudgetUsd}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#c7d2fe] text-[11px] text-[#4338ca] font-medium">
              Repays ${rescueBudgetUsd} USDC debt
            </div>
          </div>

          {/* 3. ADD COLLATERAL ($750) */}
          <div className="p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-[#ddd6fe] bg-[#fbf9ff] shadow-[0_4px_16px_rgba(124,58,237,0.08)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6d28d9]">
                  Strategy 3
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe]">
                  Requires ${rescueBudgetUsd}
                </span>
              </div>

              <h3 className="text-base font-heritage font-black text-[#2e1065] mb-1">
                Add Collateral
              </h3>
              <p className="text-[11px] text-[#475569] mb-4 font-sans leading-relaxed">
                Deposit additional collateral buffer into vault without changing outstanding loan.
              </p>

              <div className="p-3 rounded-xl bg-white border border-[#ddd6fe] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Restored HF:</span>
                  <span className="font-bold text-[#6d28d9] text-sm">
                    {math.addCollateral.hf.toFixed(3)} {math.addCollateral.hf >= 1.0 ? '✅' : '⚠️'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">New Collateral:</span>
                  <span className="text-[#1e293b]">${math.addCollateral.newCollateralUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Capital Cash:</span>
                  <span className="font-bold text-[#6d28d9]">${rescueBudgetUsd}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ddd6fe] text-[11px] text-[#6d28d9] font-medium">
              Adds ${(rescueBudgetUsd / math.pShock).toFixed(3)} ETH buffer
            </div>
          </div>

          {/* 4. COLLATERAL SWAP (ZERO CAPITAL: ETH -> USDC) */}
          <div className="p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-[#a5f3fc] bg-[#f0fdfa] shadow-[0_4px_16px_rgba(6,182,212,0.12)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0e7490]">
                  Strategy 4
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#cffafe] text-[#155e75] border border-[#a5f3fc]">
                  $0 External Cash
                </span>
              </div>

              <div className="flex items-center space-x-1.5 mb-1">
                <h3 className="text-base font-heritage font-black text-[#164e63]">
                  Collateral Swap
                </h3>
              </div>
              <p className="text-[11px] text-[#334155] mb-4 font-sans leading-relaxed">
                Swaps shocked volatile ETH into stable USDC. Freezes downward volatility and raises LT to 90%.
              </p>

              <div className="p-3 rounded-xl bg-white border border-[#a5f3fc] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Restored HF:</span>
                  <span className="font-bold text-[#0e7490] text-sm">
                    {math.collateralSwap.hf.toFixed(3)} {math.collateralSwap.hf >= 1.0 ? '✅' : '⚠️'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">New LT:</span>
                  <span className="font-bold text-[#0891b2]">90.0% (vs 82.5%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">External Cash:</span>
                  <span className="font-bold text-[#059669]">$0.00 Needed</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#a5f3fc] text-[11px] text-[#0e7490] font-medium flex items-center space-x-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#0891b2]" />
              <span>ETH → USDC 1-Click Flash Swap</span>
            </div>
          </div>

          {/* 5. PARTIAL DELEVERAGE (ZERO CAPITAL: AUTO-SELL TO TARGET HF 1.10) */}
          <div className="p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-[#a7f3d0] bg-[#f0fdf4] shadow-[0_4px_16px_rgba(16,185,129,0.15)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#047857]">
                  Strategy 5
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]">
                  Self-Liquidation Prevention
                </span>
              </div>

              <h3 className="text-base font-heritage font-black text-[#064e3b] mb-1">
                Partial Deleverage
              </h3>
              <p className="text-[11px] text-[#334155] mb-4 font-sans leading-relaxed">
                Self-rescue via smart contract flash-repay. Sells exact required collateral to restore HF to 1.10.
              </p>

              <div className="p-3 rounded-xl bg-white border border-[#a7f3d0] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Target Safe HF:</span>
                  <span className="font-bold text-[#059669] text-sm">
                    {math.partialDeleverage.hf.toFixed(2)} ✅ Safe
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Auto-Sold Collateral:</span>
                  <span className="font-bold text-[#065f46]">${math.partialDeleverage.deltaSold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">External Cash:</span>
                  <span className="font-bold text-[#059669]">$0.00 Needed</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#a7f3d0] text-[11px] text-[#047857] font-medium flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-[#059669]" />
              <span>Zero Liquidation Bonus Loss</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Regulatory & Simulation Disclaimer */}
      <div className="p-4 rounded-xl bg-[#f5e8cc] border border-[#e8d4a8] flex items-center justify-between text-xs font-mono text-[#5c503e]">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-[#b45309]" />
          <span>
            <strong>Simulation, not prediction.</strong> Stress-test models calculate deterministic smart contract formulas without warranties.
          </span>
        </div>
        <span className="hidden sm:inline font-bold text-[#4c1d95]">Bachega.fi Quant Engine</span>
      </div>
    </div>
  );
}
