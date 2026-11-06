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
      <div className="paper-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-2 border-black shadow-[4px_4px_0_#000] bg-white">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-ping"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#2563eb] font-black">
              Bachega 5-Strategy Mathematical Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            DeFi Liquidation Defense Workbench
          </h1>
          <p className="text-xs text-black/80 mt-1 font-sans font-medium">
            Evaluate exact deterministic smart contract math across 5 comprehensive rescue paths under instantaneous market shocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#fef08a] border-2 border-black shadow-[2px_2px_0_#000] flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-black" />
            <span className="text-[11px] font-mono font-black text-black">100% Read-Only</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#86efac] border-2 border-black shadow-[2px_2px_0_#000] flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-[#065f46]" />
            <span className="text-[11px] font-mono font-black text-[#065f46]">
              {backendSyncStatus === 'SYNCED' ? 'Backend Connected' : 'Pure Math Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* Position Baseline & Sensitivity Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="paper-card p-4 rounded-xl border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <span className="text-[11px] font-mono text-black/70 font-black uppercase">Current Health Factor</span>
          <div className="text-2xl font-black text-black mt-1 font-mono">
            {math.hf0.toFixed(3)}
          </div>
          <span className="text-[10px] font-mono text-[#16a34a] font-black">● Normal Equilibrium</span>
        </div>

        <div className="paper-card p-4 rounded-xl border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <span className="text-[11px] font-mono text-black/70 font-black uppercase">Liquidation Price (P_liq)</span>
          <div className="text-2xl font-black text-[#dc2626] mt-1 font-mono">
            ${math.pLiq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] font-mono text-black/60 font-bold">At HF = 1.000 Boundary</span>
        </div>

        <div className="paper-card p-4 rounded-xl border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <span className="text-[11px] font-mono text-black/70 font-black uppercase">Crash Buffer Room</span>
          <div className="text-2xl font-black text-[#2563eb] mt-1 font-mono">
            {math.bufferPct.toFixed(1)}%
          </div>
          <span className="text-[10px] font-mono text-black/60 font-bold">Max Drop Before Default</span>
        </div>

        <div className="paper-card p-4 rounded-xl border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <span className="text-[11px] font-mono text-black/70 font-black uppercase">Shocked Collateral</span>
          <div className="text-2xl font-black text-[#d97706] mt-1 font-mono">
            ${math.shockedCollateralUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] font-mono text-black/60 font-bold">Spot: ${math.pShock.toFixed(0)}</span>
        </div>
      </div>

      {/* Interactive Controls Panel */}
      <div className="paper-card p-6 rounded-2xl space-y-6 border-2 border-black shadow-[4px_4px_0_#000] bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-black pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#2563eb]" />
            <h2 className="text-base font-black text-black">Simulation Stress Parameters</h2>
          </div>
          <div className="flex items-center space-x-2">
            {[-15, -25, -35, -50].map((preset) => (
              <button
                key={preset}
                onClick={() => setPriceShockPct(preset)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-black transition-all ${
                  priceShockPct === preset
                    ? 'bg-[#3b82f6] text-white border-2 border-black shadow-[3px_3px_0_#000]'
                    : 'bg-white text-black border-2 border-black shadow-[2px_2px_0_#000] hover:bg-[#fef08a] active:translate-x-[1px] active:translate-y-[1px]'
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
              <span className="text-black font-black">ETH Market Drop Shock</span>
              <span className="text-sm font-black text-[#dc2626] bg-[#fee2e2] px-2 py-0.5 border border-black rounded shadow-[1px_1px_0_#000]">
                {priceShockPct}% Crash
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="-10"
              step="5"
              value={priceShockPct}
              onChange={(e) => setPriceShockPct(Number(e.target.value))}
              className="w-full h-2.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
            />
          </div>

          {/* Rescue Budget Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-black font-black">External Rescue Budget</span>
              <span className="text-sm font-black text-[#2563eb] bg-[#dbeafe] px-2 py-0.5 border border-black rounded shadow-[1px_1px_0_#000]">
                ${rescueBudgetUsd.toLocaleString()} USD
              </span>
            </div>
            <input
              type="range"
              min="250"
              max="2500"
              step="50"
              value={rescueBudgetUsd}
              onChange={(e) => setRescueBudgetUsd(Number(e.target.value))}
              className="w-full h-2.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
            />
          </div>

          {/* Quick Input Toggle */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-black font-black">Vault Position (Aave V3)</span>
              <span className="text-xs font-mono text-black/70 font-bold">2.5 ETH @ $3,000 | $4,500 Debt</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#fef08a] border-2 border-black shadow-[2px_2px_0_#000] text-[11px] font-mono text-black font-black flex justify-between">
              <span>LT: 82.5%</span>
              <span>Target HF: {targetHf.toFixed(2)}</span>
              <span>USDC LT: {(stableLt * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 COMPREHENSIVE STRATEGIES GRID */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-[#2563eb]" />
            <h2 className="text-xl font-black text-black">
              5 Evaluated Defense Strategies at {priceShockPct}% Shock
            </h2>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="flex items-center space-x-1.5 text-[#065f46] font-black">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] border border-black"></span>
              <span>Zero-Capital Rescue</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[#1e3a8a] font-black">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] border border-black"></span>
              <span>Capital-Required Rescue</span>
            </span>
          </div>
        </div>

        {/* Responsive 5-Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* 1. DO NOTHING */}
          <div className={`p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-black shadow-[4px_4px_0_#000] ${
            math.doNothing.isLiquidated
              ? 'bg-[#fee2e2]'
              : 'bg-white'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-black/70">
                  Strategy 1
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border-2 border-black shadow-[2px_2px_0_#000] ${
                  math.doNothing.isLiquidated
                    ? 'bg-[#ef4444] text-white animate-pulse'
                    : 'bg-[#fef08a] text-black'
                }`}>
                  {math.doNothing.isLiquidated ? 'LIQUIDATED' : 'AT RISK'}
                </span>
              </div>

              <h3 className="text-base font-black text-black mb-1">
                Do Nothing
              </h3>
              <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                Passive observation. Incur complete unmitigated price shock with zero intervention.
              </p>

              <div className="p-3 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0_#000] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Resulting HF:</span>
                  <span className={`font-black ${math.doNothing.isLiquidated ? 'text-[#dc2626]' : 'text-black'}`}>
                    {math.doNothing.hf.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Simulated LTV:</span>
                  <span className="text-black font-bold">{math.ltvDoNothing.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Capital Needed:</span>
                  <span className="font-black text-[#16a34a]">$0.00</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-black text-[11px] font-mono font-bold">
              {math.doNothing.isLiquidated ? (
                <span className="text-[#dc2626]">⚠️ Liquidation bot trigger expected</span>
              ) : (
                <span className="text-black/70">Buffer remains thin</span>
              )}
            </div>
          </div>

          {/* 2. REPAY DEBT ($750) */}
          <div className="p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-black bg-white shadow-[4px_4px_0_#000]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#2563eb]">
                  Strategy 2
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#3b82f6] text-white border-2 border-black shadow-[2px_2px_0_#000]">
                  Requires ${rescueBudgetUsd}
                </span>
              </div>

              <h3 className="text-base font-black text-black mb-1">
                Repay Debt
              </h3>
              <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                De-leverage outstanding debt with external cash to lower denominator in HF formula.
              </p>

              <div className="p-3 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0_#000] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Restored HF:</span>
                  <span className="font-black text-[#2563eb] text-sm">
                    {math.repayDebt.hf.toFixed(3)} {math.repayDebt.hf >= 1.0 ? '✅' : '⚠️'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">New Debt:</span>
                  <span className="text-black font-bold">${math.repayDebt.newDebt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Capital Cash:</span>
                  <span className="font-black text-[#2563eb]">${rescueBudgetUsd}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-black text-[11px] text-[#2563eb] font-mono font-bold">
              Repays ${rescueBudgetUsd} USDC debt
            </div>
          </div>

          {/* 3. ADD COLLATERAL ($750) */}
          <div className="p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-black bg-white shadow-[4px_4px_0_#000]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#d97706]">
                  Strategy 3
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#fef08a] text-black border-2 border-black shadow-[2px_2px_0_#000]">
                  Requires ${rescueBudgetUsd}
                </span>
              </div>

              <h3 className="text-base font-black text-black mb-1">
                Add Collateral
              </h3>
              <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                Deposit additional collateral buffer into vault without changing outstanding loan.
              </p>

              <div className="p-3 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0_#000] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Restored HF:</span>
                  <span className="font-black text-[#d97706] text-sm">
                    {math.addCollateral.hf.toFixed(3)} {math.addCollateral.hf >= 1.0 ? '✅' : '⚠️'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">New Collateral:</span>
                  <span className="text-black font-bold">${math.addCollateral.newCollateralUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Capital Cash:</span>
                  <span className="font-black text-[#d97706]">${rescueBudgetUsd}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-black text-[11px] text-[#d97706] font-mono font-bold">
              Adds ${(rescueBudgetUsd / math.pShock).toFixed(3)} ETH buffer
            </div>
          </div>

          {/* 4. COLLATERAL SWAP (ZERO CAPITAL: ETH -> USDC) */}
          <div className="p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-black bg-[#f0fdf4] shadow-[4px_4px_0_#000]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#059669]">
                  Strategy 4
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#86efac] text-[#065f46] border-2 border-black shadow-[2px_2px_0_#000]">
                  $0 External Cash
                </span>
              </div>

              <div className="flex items-center space-x-1.5 mb-1">
                <h3 className="text-base font-black text-black">
                  Collateral Swap
                </h3>
              </div>
              <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                Swaps shocked volatile ETH into stable USDC. Freezes downward volatility and raises LT to 90%.
              </p>

              <div className="p-3 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0_#000] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Restored HF:</span>
                  <span className="font-black text-[#059669] text-sm">
                    {math.collateralSwap.hf.toFixed(3)} {math.collateralSwap.hf >= 1.0 ? '✅' : '⚠️'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">New LT:</span>
                  <span className="font-black text-black">90.0% (vs 82.5%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">External Cash:</span>
                  <span className="font-black text-[#16a34a]">$0.00 Needed</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-black text-[11px] text-[#059669] font-mono font-bold flex items-center space-x-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#059669]" />
              <span>ETH → USDC 1-Click Flash Swap</span>
            </div>
          </div>

          {/* 5. PARTIAL DELEVERAGE (ZERO CAPITAL: AUTO-SELL TO TARGET HF 1.10) */}
          <div className="p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-black bg-[#f0fdf4] shadow-[4px_4px_0_#000]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#059669]">
                  Strategy 5
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#86efac] text-[#065f46] border-2 border-black shadow-[2px_2px_0_#000]">
                  Self-Rescue
                </span>
              </div>

              <h3 className="text-base font-black text-black mb-1">
                Partial Deleverage
              </h3>
              <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                Self-rescue via smart contract flash-repay. Sells exact required collateral to restore HF to 1.10.
              </p>

              <div className="p-3 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0_#000] space-y-2 text-xs font-mono mb-4">
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Target Safe HF:</span>
                  <span className="font-black text-[#16a34a] text-sm">
                    {math.partialDeleverage.hf.toFixed(2)} ✅ Safe
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">Auto-Sold Collateral:</span>
                  <span className="font-black text-black">${math.partialDeleverage.deltaSold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/70 font-bold">External Cash:</span>
                  <span className="font-black text-[#16a34a]">$0.00 Needed</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-black text-[11px] text-[#059669] font-mono font-bold flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-[#059669]" />
              <span>Zero Liquidation Bonus Loss</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Regulatory & Simulation Disclaimer */}
      <div className="p-4 rounded-xl bg-[#fef08a] border-2 border-black shadow-[3px_3px_0_#000] flex items-center justify-between text-xs font-mono text-black">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-black" />
          <span>
            <strong>Simulation, not prediction.</strong> Stress-test models calculate deterministic smart contract formulas without warranties.
          </span>
        </div>
        <span className="hidden sm:inline font-black text-black">Bachega.fi Quant Engine</span>
      </div>
    </div>
  );
}

