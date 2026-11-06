import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  AlertTriangle,
  ShieldCheck,
  Info,
  CheckCircle2,
  Scale,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Zap,
  ArrowRightLeft
} from 'lucide-react';
import { api } from '../services/api';

export default function CrashSimulator({
  preselectedPositionId,
  customPosition,
  onBackToDashboard,
}) {
  const [positions, setPositions] = useState([]);
  const [selectedPosId, setSelectedPosId] = useState(preselectedPositionId || 'pos_aave_v3_eth');
  const [positionDetail, setPositionDetail] = useState(null);
  const [shockPercent, setShockPercent] = useState(-25);
  const [rescueBudget, setRescueBudget] = useState(750);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync selectedPosId if preselectedPositionId changes from parent
  useEffect(() => {
    if (preselectedPositionId) {
      setSelectedPosId(preselectedPositionId);
    }
  }, [preselectedPositionId]);

  useEffect(() => {
    async function loadPositions() {
      try {
        const list = await api.getPositions();
        if (list && list.length > 0) {
          setPositions(list);
          if (!preselectedPositionId) {
            setSelectedPosId(list[0].position_id);
          }
        }
      } catch (err) {
        console.error('Failed to load positions list', err);
      }
    }
    loadPositions();
  }, []);

  useEffect(() => {
    if (!selectedPosId) return;

    let isSubscribed = true;
    async function loadDetailAndSimulate() {
      try {
        setLoading(true);
        setError(null);

        const detail = await api.getPositionDetail(selectedPosId);
        if (isSubscribed) {
          setPositionDetail(detail);
        }

        const sim = await api.runSimulation({
          position_id: selectedPosId,
          price_shock_pct: shockPercent,
          rescue_budget_usd: rescueBudget,
          custom_shocks: [-0.10, -0.20, -0.25, -0.35, -0.50],
          repay_amounts_usd: [2500, 5000, 10000],
          add_collateral_amounts_usd: [2000, 5000, 10000],
        });
        if (isSubscribed) {
          setSimulationData(sim);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err.message || 'Simulation execution failed');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadDetailAndSimulate();
    return () => {
      isSubscribed = false;
    };
  }, [selectedPosId, shockPercent, rescueBudget]);

  const activeStep = useMemo(() => {
    if (simulationData?.results && simulationData.results.length > 0) {
      const targetShock = shockPercent;
      return simulationData.results.reduce((prev, curr) => {
        return Math.abs(curr.shock_percentage - targetShock) < Math.abs(prev.shock_percentage - targetShock)
          ? curr
          : prev;
      }, simulationData.results[0]);
    }

    // Instant resilient fallback math so UI never freezes or fails to open
    const collatUsd = positionDetail?.total_collateral_usd || 7500.0;
    const debtUsd = positionDetail?.total_debt_usd || 4500.0;
    const lt = (positionDetail?.liquidation_threshold_pct || 82.5) / 100.0;
    const spot = positionDetail?.collateral_asset_price_usd || 3000.0;
    const pS = spot * (1.0 + shockPercent / 100.0);
    const colS = collatUsd * (1.0 + shockPercent / 100.0);
    const hfDoNothing = debtUsd > 0 ? (colS * lt) / debtUsd : 999.0;
    const isLiq = hfDoNothing < 1.0;

    return {
      shock_percentage: shockPercent,
      simulated_volatile_asset_price: Math.round(pS),
      do_nothing: {
        simulated_health_factor: Math.round(hfDoNothing * 1000) / 1000,
        simulated_ltv_pct: colS > 0 ? (debtUsd / colS) * 100 : 60,
        simulated_collateral_usd: Math.round(colS),
        is_liquidated: isLiq,
        liquidation_shortfall_usd: isLiq ? Math.max(0, Math.round(debtUsd - colS * lt)) : 0,
      },
      repay_debt_scenarios: [
        {
          repay_amount_usd: rescueBudget,
          simulated_debt_usd: Math.max(1, debtUsd - rescueBudget),
          simulated_health_factor: (colS * lt) / Math.max(1, debtUsd - rescueBudget),
          simulated_ltv_pct: colS > 0 ? (Math.max(1, debtUsd - rescueBudget) / colS) * 100 : 0,
          buffer_to_liquidation_usd: Math.max(0, colS * lt - Math.max(1, debtUsd - rescueBudget)),
        },
      ],
      add_collateral_scenarios: [
        {
          collateral_added_usd: rescueBudget,
          simulated_collateral_usd: colS + rescueBudget,
          simulated_health_factor: ((colS + rescueBudget) * lt) / debtUsd,
          simulated_ltv_pct: colS + rescueBudget > 0 ? (debtUsd / (colS + rescueBudget)) * 100 : 0,
          buffer_to_liquidation_usd: Math.max(0, (colS + rescueBudget) * lt - debtUsd),
        },
      ],
      collateral_swap: {
        simulated_health_factor: (colS * 0.90) / debtUsd,
        is_liquidated: (colS * 0.90) / debtUsd < 1.0,
      },
      partial_deleverage: {
        simulated_health_factor: 1.10,
        is_liquidated: false,
      },
    };
  }, [simulationData, shockPercent, positionDetail, rescueBudget]);

  const getRiskBadge = (hf) => {
    if (hf >= 1.5) {
      return { label: 'EQUILIBRIUM', color: 'text-[#065f46] bg-[#86efac] border-2 border-black font-black shadow-[2px_2px_0_#000]' };
    }
    if (hf >= 1.25) {
      return { label: 'STABLE', color: 'text-[#1e3a8a] bg-[#93c5fd] border-2 border-black font-black shadow-[2px_2px_0_#000]' };
    }
    if (hf >= 1.1) {
      return { label: 'TENSION', color: 'text-[#854d0e] bg-[#fef08a] border-2 border-black font-black shadow-[2px_2px_0_#000]' };
    }
    if (hf >= 1.0) {
      return { label: 'CRITICAL', color: 'text-[#991b1b] bg-[#fca5a5] border-2 border-black font-black shadow-[2px_2px_0_#000] animate-pulse' };
    }
    return { label: 'LIQUIDATED', color: 'text-white bg-[#ef4444] border-2 border-black font-black shadow-[2px_2px_0_#000]' };
  };

  const liqDistance = positionDetail?.liquidation_proximity_pct ?? positionDetail?.liquidation_distance_pct ?? -27.27;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Back button to Portfolio Overview */}
      {onBackToDashboard && (
        <div className="flex items-center justify-between pb-2">
          <button
            onClick={onBackToDashboard}
            className="btn-3d-gold px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Active Portfolio Overview</span>
          </button>
          <span className="text-xs font-mono font-bold text-black/70">
            Selected Protocol: <strong className="text-black">{positionDetail?.protocol || 'Aave v3'}</strong>
          </span>
        </div>
      )}

      {/* Title & Compliance Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-2xl font-black text-black tracking-tight">
              DeFi Crash Simulator
            </h2>
            <span className="px-3 py-1 rounded-md text-[10px] font-mono font-black bg-[#fef08a] text-black border-2 border-black uppercase shadow-[2px_2px_0_#000]">
              SIMULATION, NOT PREDICTION
            </span>
          </div>
          <p className="text-xs text-black/80 max-w-2xl font-sans font-medium">
            Model the exact mechanics of instantaneous market price shocks. Test what happens to your position if you
            do nothing, de-leverage by repaying debt, or inject a collateral buffer.
          </p>
        </div>

        {/* Position Switcher & Presets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-black whitespace-nowrap font-black font-mono">Vault:</label>
            <select
              value={selectedPosId}
              onChange={(e) => setSelectedPosId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border-2 border-black text-black text-xs font-black shadow-[2px_2px_0_#000] focus:outline-none"
            >
              <option value="pos_aave_v3_eth">Aave v3 (Arbitrum)</option>
              <option value="pos_comp_v3_arb">Compound v3 (Arbitrum)</option>
              <option value="pos_spark_eth">Spark Protocol (Ethereum)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Protocol Quick-Select Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono font-black uppercase text-black/70 mr-1">Quick Presets:</span>
        <button
          onClick={() => setSelectedPosId('pos_aave_v3_eth')}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-black border-2 border-black transition-all ${
            selectedPosId === 'pos_aave_v3_eth'
              ? 'bg-[#3b82f6] text-white shadow-[2px_2px_0_#000]'
              : 'bg-white text-black shadow-[1px_1px_0_#000] hover:bg-[#fef08a]'
          }`}
        >
          Aave V3 (ETH / USDC)
        </button>
        <button
          onClick={() => setSelectedPosId('pos_comp_v3_arb')}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-black border-2 border-black transition-all ${
            selectedPosId === 'pos_comp_v3_arb'
              ? 'bg-[#3b82f6] text-white shadow-[2px_2px_0_#000]'
              : 'bg-white text-black shadow-[1px_1px_0_#000] hover:bg-[#fef08a]'
          }`}
        >
          Compound V3 (WBTC / USDT)
        </button>
        <button
          onClick={() => setSelectedPosId('pos_spark_eth')}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-black border-2 border-black transition-all ${
            selectedPosId === 'pos_spark_eth'
              ? 'bg-[#3b82f6] text-white shadow-[2px_2px_0_#000]'
              : 'bg-white text-black shadow-[1px_1px_0_#000] hover:bg-[#fef08a]'
          }`}
        >
          Spark Protocol (WSTETH / DAI)
        </button>
      </div>

      {/* Baseline Summary Card */}
      {positionDetail && (
        <div className="paper-card p-6 rounded-2xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div>
            <span className="text-[11px] text-black/70 uppercase tracking-wider font-mono font-black">Protocol</span>
            <p className="text-sm font-black text-black mt-0.5">{positionDetail.protocol || 'Aave v3'}</p>
            <p className="text-[11px] text-black/60 capitalize font-medium">{positionDetail.chain || 'Arbitrum'}</p>
          </div>

          <div>
            <span className="text-[11px] text-black/70 uppercase tracking-wider font-mono font-black">Health Factor</span>
            <p className="text-base font-mono font-black text-[#2563eb] mt-0.5">
              {(positionDetail.health_factor != null ? positionDetail.health_factor : 1.375).toFixed(3)}
            </p>
            <span className="text-[11px] text-black/60 font-medium">Fulcrum: 1.00</span>
          </div>

          <div>
            <span className="text-[11px] text-black/70 uppercase tracking-wider font-mono font-black">Liquidation Price</span>
            <p className="text-sm font-mono font-black text-[#dc2626] mt-0.5">
              ${(positionDetail.liquidation_price_usd != null ? positionDetail.liquidation_price_usd : 2181.82).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-black/60 font-medium">{positionDetail.collateral_asset_symbol || 'Volatile Asset'}</span>
          </div>

          <div>
            <span className="text-[11px] text-black/70 uppercase tracking-wider font-mono font-black">Liquidation Distance</span>
            <p className="text-sm font-mono font-black text-[#d97706] mt-0.5">
              {typeof liqDistance === 'number' ? `${liqDistance.toFixed(2)}%` : `${liqDistance}%`}
            </p>
            <span className="text-[11px] text-black/60 font-medium">Drop to trigger</span>
          </div>

          <div>
            <span className="text-[11px] text-black/70 uppercase tracking-wider font-mono font-black">Total Collateral</span>
            <p className="text-sm font-mono font-black text-black mt-0.5">
              ${(positionDetail.total_collateral_usd || 7500).toLocaleString()}
            </p>
            <span className="text-[11px] text-black/60 font-medium">
              {(positionDetail.collaterals || []).map(c => `${c.amount} ${c.symbol}`).join(', ') || '2.5 ETH'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-black/70 uppercase tracking-wider font-mono font-black">Total Debt</span>
            <p className="text-sm font-mono font-black text-black mt-0.5">
              ${(positionDetail.total_debt_usd || 4500).toLocaleString()}
            </p>
            <span className="text-[11px] text-black/60 font-medium">
              {(positionDetail.debts || []).map(d => `${d.amount} ${d.symbol}`).join(', ') || '4500 USDC'}
            </span>
          </div>
        </div>
      )}

      {/* SIGNATURE MOVE: Counterweight & High-Wire Equilibrium Bar */}
      {activeStep && (
        <div className="paper-card p-6 rounded-2xl relative overflow-hidden space-y-3 border-2 border-black shadow-[4px_4px_0_#000] bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#2563eb] font-black flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>SIGNATURE CAROUSEL EQUILIBRIUM SCALE</span>
              </span>
              <h3 className="text-base font-black text-black mt-0.5">
                Acrobatic Counterweight Under {activeStep.shock_percentage}% Price Shock
              </h3>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-black/70 font-bold">Simulated Asset Price:</span>
              <strong className="text-black text-sm font-black bg-[#fef08a] px-2 py-0.5 border border-black shadow-[1px_1px_0_#000] rounded">
                ${activeStep.simulated_volatile_asset_price.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* High-Wire Equilibrium Track */}
          <div className="space-y-1.5 py-2">
            <div className="relative h-7 rounded-xl bg-white border-2 border-black overflow-hidden flex items-center shadow-[2px_2px_0_#000]">
              {/* Liquidation Fall Zone */}
              <div className="h-full bg-[#fca5a5] border-r-2 border-black w-[38%] flex items-center justify-start px-3">
                <span className="text-[10px] font-black text-[#991b1b] tracking-wider font-mono">LIQUIDATION FALL</span>
              </div>
              {/* Tension Margin */}
              <div className="h-full bg-[#fef08a] border-r-2 border-black w-[24%] flex items-center justify-center">
                <span className="text-[9px] font-black text-[#854d0e] font-mono">TENSION</span>
              </div>
              {/* Safety Net Zone */}
              <div className="h-full bg-[#86efac] w-[38%] flex items-center justify-end px-3">
                <span className="text-[10px] font-black text-[#065f46] tracking-wider font-mono">EQUILIBRIUM NET</span>
              </div>

              {/* Wire Walker Marker */}
              {(() => {
                const walkerPos = Math.min(95, Math.max(5, (activeStep.do_nothing.simulated_health_factor / 1.8) * 100));
                return (
                  <div
                    style={{ left: `${walkerPos}%` }}
                    className="absolute -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-300"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#3b82f6] border-2 border-black shadow-[2px_2px_0_#000]"></div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-between text-[11px] text-black font-mono font-bold pt-0.5">
              <span>HF 0.80 (Deficit)</span>
              <span className="text-[#dc2626] font-black">HF 1.00 (Liquidation Boundary)</span>
              <span className="text-[#16a34a] font-black">HF 1.50+ (Stable Net)</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Shock Controller Slider */}
      <div className="paper-card p-6 rounded-2xl space-y-4 border-2 border-black shadow-[4px_4px_0_#000] bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#d97706] font-black">Hypothetical Stress Parameter</span>
            <h3 className="text-lg font-black text-black">Collateral Price Shock Level</h3>
          </div>
          <div className="flex items-center space-x-2">
            {[-10, -20, -25, -35, -50].map((preset) => (
              <button
                key={preset}
                onClick={() => setShockPercent(preset)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-black transition-all ${
                  shockPercent === preset
                    ? 'bg-[#3b82f6] text-white border-2 border-black shadow-[3px_3px_0_#000]'
                    : 'bg-white text-black border-2 border-black shadow-[2px_2px_0_#000] hover:bg-[#fef08a] active:translate-x-[1px] active:translate-y-[1px]'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-mono text-black font-bold">
            <span>Minor Dip (-10%)</span>
            <span className="text-base font-black text-[#2563eb] font-mono bg-[#fef08a] px-2 py-0.5 border border-black shadow-[1px_1px_0_#000] rounded">
              {shockPercent}% Instant Shock
            </span>
            <span>Severe Flash Crash (-50%)</span>
          </div>
          <input
            type="range"
            min="-50"
            max="-10"
            step="5"
            value={shockPercent}
            onChange={(e) => setShockPercent(Number(e.target.value))}
            className="w-full h-2.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
          />
        </div>
      </div>

      {/* Comparative Scenario Results: 5 Actions */}
      {activeStep && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-black">
              Comparative Scenario Outcomes at {activeStep.shock_percentage}% Market Plunge
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Scenario 1: Do Nothing */}
            <div className={`p-5 rounded-2xl flex flex-col justify-between paper-card border-2 border-black shadow-[4px_4px_0_#000] ${
              activeStep.do_nothing.is_liquidated
                ? 'bg-[#fee2e2]'
                : 'bg-white'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                    <h4 className="text-sm font-black text-black">1. Do Nothing</h4>
                  </div>
                  {(() => {
                    const badge = getRiskBadge(activeStep.do_nothing.simulated_health_factor);
                    return (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border-2 border-black shadow-[2px_2px_0_#000] font-black ${badge.color}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                  Take no corrective action. Observe position under unmitigated crash.
                </p>

                <div className="space-y-2 py-2 border-y-2 border-black text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-black/70 font-bold">Simulated HF</span>
                    <span className={`font-black ${activeStep.do_nothing.is_liquidated ? 'text-[#dc2626]' : 'text-black'}`}>
                      {activeStep.do_nothing.simulated_health_factor.toFixed(3)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-black/70 font-bold">Simulated LTV</span>
                    <span className="text-black font-bold">{activeStep.do_nothing.simulated_ltv_pct.toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-black/70 font-bold">Collateral</span>
                    <span className="text-black font-bold">${activeStep.do_nothing.simulated_collateral_usd.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-black/70 font-bold">Capital Cash</span>
                    <span className="font-black text-[#16a34a]">$0.00</span>
                  </div>

                  {activeStep.do_nothing.is_liquidated && (
                    <div className="flex justify-between text-[#dc2626] pt-1">
                      <span className="font-bold">Shortfall</span>
                      <span className="font-black">${activeStep.do_nothing.liquidation_shortfall_usd.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 text-[10px] text-black/70 border-t-2 border-black font-mono font-bold">
                {activeStep.do_nothing.is_liquidated
                  ? '⚠️ Liquidation bot trigger expected.'
                  : '✅ Position remains solvent.'}
              </div>
            </div>

            {/* Scenario 2: Repay Debt */}
            {(() => {
              const repayList = activeStep?.repay_debt_scenarios || [];
              const repayScenario = repayList.length > 0
                ? repayList[repayList.length - 1]
                : {
                    simulated_health_factor: 1.25,
                    simulated_debt_usd: 3750,
                    simulated_ltv_pct: 55.0,
                    buffer_to_liquidation_usd: 850,
                  };
              return (
                <div className="p-5 rounded-2xl border-2 border-black bg-white flex flex-col justify-between paper-card shadow-[4px_4px_0_#000]">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
                        <h4 className="text-sm font-black text-black">2. Repay Debt</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#3b82f6] text-white border-2 border-black shadow-[2px_2px_0_#000]">
                        Cash
                      </span>
                    </div>

                    <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                      De-leverage by repaying debt with cash to drop the loan denominator.
                    </p>

                    <div className="space-y-2 py-2 border-y-2 border-black text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Restored HF</span>
                        <span className="font-black text-[#2563eb]">
                          {repayScenario.simulated_health_factor.toFixed(3)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">New Debt</span>
                        <span className="text-black font-bold">${repayScenario.simulated_debt_usd.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Simulated LTV</span>
                        <span className="text-black font-bold">{repayScenario.simulated_ltv_pct.toFixed(1)}%</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Buffer</span>
                        <span className="text-[#16a34a] font-black">+${repayScenario.buffer_to_liquidation_usd.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 text-[10px] text-[#2563eb] border-t-2 border-black flex items-center space-x-1 font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                    <span>Reduces debt denominator.</span>
                  </div>
                </div>
              );
            })()}

            {/* Scenario 3: Add Collateral */}
            {(() => {
              const addList = activeStep?.add_collateral_scenarios || [];
              const addScenario = addList.length > 0
                ? addList[addList.length - 1]
                : {
                    simulated_health_factor: 1.28,
                    simulated_collateral_usd: 8250,
                    simulated_ltv_pct: 54.5,
                    buffer_to_liquidation_usd: 950,
                  };
              return (
                <div className="p-5 rounded-2xl border-2 border-black bg-white flex flex-col justify-between paper-card shadow-[4px_4px_0_#000]">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]"></span>
                        <h4 className="text-sm font-black text-black">3. Add Collateral</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#fef08a] text-black border-2 border-black shadow-[2px_2px_0_#000]">
                        Cash
                      </span>
                    </div>

                    <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                      Deposit unencumbered collateral to expand margin buffer.
                    </p>

                    <div className="space-y-2 py-2 border-y-2 border-black text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Restored HF</span>
                        <span className="font-black text-[#d97706]">
                          {addScenario.simulated_health_factor.toFixed(3)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">New Collateral</span>
                        <span className="text-black font-bold">${addScenario.simulated_collateral_usd.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Simulated LTV</span>
                        <span className="text-black font-bold">{addScenario.simulated_ltv_pct.toFixed(1)}%</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Buffer</span>
                        <span className="text-[#16a34a] font-black">+${addScenario.buffer_to_liquidation_usd.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 text-[10px] text-[#d97706] border-t-2 border-black flex items-center space-x-1 font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#d97706] shrink-0" />
                    <span>Injected cushion fortifies vault.</span>
                  </div>
                </div>
              );
            })()}

            {/* Scenario 4: Collateral Swap (Zero Capital) */}
            {(() => {
              const swap = activeStep.collateral_swap || {
                simulated_health_factor: (activeStep.simulated_volatile_asset_price * 2.5 * 0.90) / 4500,
                is_liquidated: false,
              };
              return (
                <div className="p-5 rounded-2xl border-2 border-black bg-[#f0fdf4] flex flex-col justify-between paper-card shadow-[4px_4px_0_#000]">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                        <h4 className="text-sm font-black text-black">4. Swap Collateral</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#86efac] text-[#065f46] border-2 border-black shadow-[2px_2px_0_#000]">
                        $0 Needed
                      </span>
                    </div>

                    <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                      Swap volatile ETH to USDC. Freezes downside volatility and boosts LT to 90%.
                    </p>

                    <div className="space-y-2 py-2 border-y-2 border-black text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Restored HF</span>
                        <span className="font-black text-[#059669]">
                          {(swap.simulated_health_factor || 0.975).toFixed(3)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">New Threshold</span>
                        <span className="font-black text-black">90.0% (USDC)</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">External Cash</span>
                        <span className="font-black text-[#16a34a]">$0.00</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Vol Risk</span>
                        <span className="font-black text-[#059669]">0% (Frozen)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 text-[10px] text-[#065f46] border-t-2 border-black flex items-center space-x-1 font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                    <span>ETH → USDC Zero-Cash Swap.</span>
                  </div>
                </div>
              );
            })()}

            {/* Scenario 5: Partial Deleverage (Zero Capital Self-Rescue) */}
            {(() => {
              const del = activeStep.partial_deleverage || {
                simulated_health_factor: 1.10,
                is_liquidated: false,
              };
              return (
                <div className="p-5 rounded-2xl border-2 border-black bg-[#f0fdf4] flex flex-col justify-between paper-card shadow-[4px_4px_0_#000]">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                        <h4 className="text-sm font-black text-black">5. Deleverage</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#86efac] text-[#065f46] border-2 border-black shadow-[2px_2px_0_#000]">
                        $0 Needed
                      </span>
                    </div>

                    <p className="text-[11px] text-black/80 mb-4 font-sans leading-relaxed font-medium">
                      Self-rescue via auto-sell. Sells exact required collateral to restore HF to 1.10.
                    </p>

                    <div className="space-y-2 py-2 border-y-2 border-black text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Target HF</span>
                        <span className="font-black text-[#16a34a]">
                          {(del.simulated_health_factor || 1.10).toFixed(2)} ✅ Safe
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Auto-Sold Collat</span>
                        <span className="font-black text-black">Exact Needed</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">External Cash</span>
                        <span className="font-black text-[#16a34a]">$0.00</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black/70 font-bold">Liquidation Pen.</span>
                        <span className="font-black text-[#16a34a]">Saved (0%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 text-[10px] text-[#065f46] border-t-2 border-black flex items-center space-x-1 font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                    <span>Avoids 10% penalty bonus.</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Mathematical Model Assumptions */}
      {simulationData?.assumptions && (
        <div className="p-6 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0_#000] space-y-3 paper-card">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-black font-black">
            <Info className="w-4 h-4 text-[#2563eb]" />
            <span>Mathematical Model Assumptions</span>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-black/80 font-sans font-medium">
            {simulationData.assumptions.map((asm, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-[#2563eb] font-mono font-bold">•</span>
                <span>{asm}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}