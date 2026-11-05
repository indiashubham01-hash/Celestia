import React, { useState, useEffect } from 'react';
import {
  Sliders,
  AlertTriangle,
  ShieldCheck,
  Info,
  CheckCircle2,
  Scale
} from 'lucide-react';
import { api } from '../services/api';

export default function CrashSimulator({ preselectedPositionId }) {
  const [positions, setPositions] = useState([]);
  const [selectedPosId, setSelectedPosId] = useState(preselectedPositionId || 'pos_aave_v3_eth');
  const [positionDetail, setPositionDetail] = useState(null);
  const [shockPercent, setShockPercent] = useState(-25);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPositions() {
      try {
        const list = await api.getPositions();
        setPositions(list);
        if (preselectedPositionId) {
          setSelectedPosId(preselectedPositionId);
        } else if (list.length > 0) {
          setSelectedPosId(list[0].position_id);
        }
      } catch (err) {
        console.error('Failed to load positions list', err);
      }
    }
    loadPositions();
  }, [preselectedPositionId]);

  useEffect(() => {
    if (!selectedPosId) return;

    async function loadDetailAndSimulate() {
      try {
        setLoading(true);
        setError(null);

        const detail = await api.getPositionDetail(selectedPosId);
        setPositionDetail(detail);

        const sim = await api.runSimulation({
          position_id: selectedPosId,
          custom_shocks: [-0.10, -0.20, -0.25, -0.35, -0.50],
          repay_amounts_usd: [2500, 5000, 10000],
          add_collateral_amounts_usd: [2000, 5000, 10000],
        });
        setSimulationData(sim);
      } catch (err) {
        setError(err.message || 'Simulation execution failed');
      } finally {
        setLoading(false);
      }
    }

    loadDetailAndSimulate();
  }, [selectedPosId]);

  const getActiveShockStep = () => {
    if (!simulationData?.results) return null;
    const targetShock = shockPercent;
    return simulationData.results.reduce((prev, curr) => {
      return Math.abs(curr.shock_percentage - targetShock) < Math.abs(prev.shock_percentage - targetShock)
        ? curr
        : prev;
    }, simulationData.results[0]);
  };

  const activeStep = getActiveShockStep();

  const getRiskBadge = (hf) => {
    if (hf >= 1.5) {
      return { label: 'EQUILIBRIUM', color: 'text-emerald-900 bg-emerald-100 border-emerald-300' };
    }
    if (hf >= 1.25) {
      return { label: 'STABLE', color: 'text-blue-900 bg-blue-100 border-blue-300' };
    }
    if (hf >= 1.1) {
      return { label: 'TENSION', color: 'text-amber-900 bg-amber-100 border-amber-300' };
    }
    if (hf >= 1.0) {
      return { label: 'CRITICAL', color: 'text-rose-900 bg-rose-100 border-rose-300' };
    }
    return { label: 'LIQUIDATED', color: 'text-red-950 bg-red-200 border-red-400 font-bold' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Title & Compliance Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-amber-900/15 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-2xl font-heritage font-extrabold text-slate-900 tracking-tight">
              DeFi Crash Simulator
            </h2>
            <span className="px-3 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
              SIMULATION, NOT PREDICTION
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl font-sans">
            Model the exact mechanics of instantaneous market price shocks. Test what happens to your position if you
            do nothing, de-leverage by repaying debt, or inject a collateral buffer.
          </p>
        </div>

        {/* Position Switcher */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-600 whitespace-nowrap font-medium">Target Position:</label>
          <select
            value={selectedPosId}
            onChange={(e) => setSelectedPosId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-amber-900/20 text-slate-900 text-xs font-bold focus:outline-none focus:border-terracotta shadow-sm"
          >
            {positions.map((p) => (
              <option key={p.position_id} value={p.position_id}>
                {p.protocol} ({p.chain})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Baseline Summary Card */}
      {positionDetail && (
        <div className="paper-card p-6 rounded-2xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Protocol</span>
            <p className="text-sm font-heritage font-bold text-slate-900 mt-0.5">{positionDetail.protocol}</p>
            <p className="text-[11px] text-slate-500 capitalize">{positionDetail.chain}</p>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Health Factor</span>
            <p className="text-base font-mono font-bold text-terracotta mt-0.5">
              {positionDetail.health_factor.toFixed(3)}
            </p>
            <span className="text-[11px] text-slate-500">Fulcrum: 1.00</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Liquidation Price</span>
            <p className="text-sm font-mono font-bold text-carmine mt-0.5">
              ${positionDetail.liquidation_price_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-500">Volatile Asset</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Liquidation Distance</span>
            <p className="text-sm font-mono font-bold text-brass mt-0.5">
              {positionDetail.liquidation_proximity_pct.toFixed(2)}%
            </p>
            <span className="text-[11px] text-slate-500">Drop to trigger</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Total Collateral</span>
            <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
              ${positionDetail.total_collateral_usd.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500">
              {positionDetail.collaterals.map(c => `${c.amount} ${c.symbol}`).join(', ')}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">Total Debt</span>
            <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
              ${positionDetail.total_debt_usd.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500">
              {positionDetail.debts.map(d => `${d.amount} ${d.symbol}`).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* SIGNATURE MOVE: Carousel Counterweight & High-Wire Equilibrium Bar */}
      {activeStep && (
        <div className="paper-card p-6 rounded-2xl relative overflow-hidden space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-terracotta" />
                <span>SIGNATURE CAROUSEL EQUILIBRIUM SCALE</span>
              </span>
              <h3 className="text-base font-heritage font-bold text-slate-900 mt-0.5">
                Acrobatic Counterweight Under {activeStep.shock_percentage}% Price Shock
              </h3>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-500">Simulated Asset Price:</span>
              <strong className="text-slate-900 text-sm">${activeStep.simulated_volatile_asset_price.toLocaleString()}</strong>
            </div>
          </div>

          {/* High-Wire Equilibrium Track */}
          <div className="space-y-1.5 py-2">
            <div className="relative h-6 rounded-full bg-slate-100 border border-slate-300 overflow-hidden flex items-center shadow-inner">
              {/* Liquidation Fall Zone */}
              <div className="h-full bg-rose-200/90 border-r border-rose-300 w-[38%] flex items-center justify-start px-3">
                <span className="text-[10px] font-bold text-rose-900 tracking-wider font-mono">LIQUIDATION FALL</span>
              </div>
              {/* Tension Margin */}
              <div className="h-full bg-amber-200/80 border-r border-amber-300 w-[24%] flex items-center justify-center">
                <span className="text-[9px] font-bold text-amber-900 font-mono">TENSION</span>
              </div>
              {/* Safety Net Zone */}
              <div className="h-full bg-emerald-200/90 w-[38%] flex items-center justify-end px-3">
                <span className="text-[10px] font-bold text-emerald-900 tracking-wider font-mono">EQUILIBRIUM NET</span>
              </div>

              {/* Wire Walker Marker */}
              {(() => {
                const walkerPos = Math.min(95, Math.max(5, (activeStep.do_nothing.simulated_health_factor / 1.8) * 100));
                return (
                  <div
                    style={{ left: `${walkerPos}%` }}
                    className="absolute -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-300"
                  >
                    <div className="w-4 h-4 rounded-full bg-terracotta border-2 border-white shadow-md"></div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-0.5">
              <span>HF 0.80 (Deficit)</span>
              <span className="text-rose-700 font-bold">HF 1.00 (Liquidation Boundary)</span>
              <span className="text-emerald-800 font-bold">HF 1.50+ (Stable Net)</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Shock Controller Slider */}
      <div className="paper-card p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">Hypothetical Stress Parameter</span>
            <h3 className="text-lg font-heritage font-bold text-slate-900">Collateral Price Shock Level</h3>
          </div>
          <div className="flex items-center space-x-2">
            {[-10, -20, -25, -35, -50].map((preset) => (
              <button
                key={preset}
                onClick={() => setShockPercent(preset)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  shockPercent === preset
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'bg-amber-50 text-slate-700 border border-amber-200 hover:border-amber-400'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-mono text-slate-600">
            <span>Minor Dip (-10%)</span>
            <span className="text-base font-bold text-terracotta font-mono">{shockPercent}% Instant Shock</span>
            <span>Severe Flash Crash (-50%)</span>
          </div>
          <input
            type="range"
            min="-50"
            max="-10"
            step="5"
            value={shockPercent}
            onChange={(e) => setShockPercent(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-terracotta"
          />
        </div>
      </div>

      {/* Comparative Scenario Results: 3 Actions */}
      {activeStep && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heritage font-bold text-slate-900">
              Comparative Scenario Outcomes at {activeStep.shock_percentage}% Market Plunge
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Scenario 1: Do Nothing */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between paper-card ${
              activeStep.do_nothing.is_liquidated
                ? 'border-rose-300 bg-rose-50/70'
                : 'border-amber-900/15 bg-white'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <h4 className="text-base font-heritage font-bold text-slate-900">1. Do Nothing</h4>
                  </div>
                  {(() => {
                    const badge = getRiskBadge(activeStep.do_nothing.simulated_health_factor);
                    return (
                      <span className={`px-2 py-0.5 rounded text-xs font-mono border ${badge.color}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                <p className="text-xs text-slate-600 mb-6 font-sans">
                  Take no corrective action. Observe position under unmitigated crash.
                </p>

                <div className="space-y-3 py-3 border-y border-amber-900/15 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Simulated Health Factor</span>
                    <span className={`font-bold ${activeStep.do_nothing.is_liquidated ? 'text-rose-700' : 'text-slate-900'}`}>
                      {activeStep.do_nothing.simulated_health_factor.toFixed(3)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Simulated LTV</span>
                    <span className="text-slate-800">{activeStep.do_nothing.simulated_ltv_pct.toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Collateral Value</span>
                    <span className="text-slate-800">${activeStep.do_nothing.simulated_collateral_usd.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Liquidation Status</span>
                    <span className={`font-bold ${activeStep.do_nothing.is_liquidated ? 'text-carmine' : 'text-sage'}`}>
                      {activeStep.do_nothing.is_liquidated ? 'LIQUIDATED' : 'SAFE'}
                    </span>
                  </div>

                  {activeStep.do_nothing.is_liquidated && (
                    <div className="flex justify-between text-carmine pt-1">
                      <span className="font-sans font-bold">Liquidation Shortfall</span>
                      <span className="font-bold">${activeStep.do_nothing.liquidation_shortfall_usd.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 text-[11px] text-slate-500 border-t border-amber-900/10 font-sans">
                {activeStep.do_nothing.is_liquidated
                  ? '⚠️ Position breaches HF 1.0. Eligible for bot liquidation penalties.'
                  : '✅ Position remains above 1.0 with diminished safety buffer.'}
              </div>
            </div>

            {/* Scenario 2: Repay Debt */}
            {(() => {
              const repayScenario = activeStep.repay_debt_scenarios[activeStep.repay_debt_scenarios.length - 1];
              const badge = getRiskBadge(repayScenario.simulated_health_factor);
              return (
                <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50/60 flex flex-col justify-between paper-card">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-deck"></span>
                        <h4 className="text-base font-heritage font-bold text-slate-900">2. Repay Debt</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-6 font-sans">
                      De-leverage by repaying $10,000 in outstanding debt before crash hits.
                    </p>

                    <div className="space-y-3 py-3 border-y border-blue-200 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Simulated Health Factor</span>
                        <span className="font-bold text-deck">
                          {repayScenario.simulated_health_factor.toFixed(3)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Remaining Debt</span>
                        <span className="text-slate-800">${repayScenario.simulated_debt_usd.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Simulated LTV</span>
                        <span className="text-slate-800">{repayScenario.simulated_ltv_pct.toFixed(1)}%</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Liquidation Buffer</span>
                        <span className="text-sage font-bold">+${repayScenario.buffer_to_liquidation_usd.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 text-[11px] text-blue-900 border-t border-blue-200 flex items-center space-x-1.5 font-sans font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-deck shrink-0" />
                    <span>Reduces debt denominator to protect margin boundary.</span>
                  </div>
                </div>
              );
            })()}

            {/* Scenario 3: Add Collateral */}
            {(() => {
              const addScenario = activeStep.add_collateral_scenarios[activeStep.add_collateral_scenarios.length - 1];
              const badge = getRiskBadge(addScenario.simulated_health_factor);
              return (
                <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between paper-card">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sage"></span>
                        <h4 className="text-base font-heritage font-bold text-slate-900">3. Add Collateral</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-6 font-sans">
                      Deposit +$10,000 in unencumbered stable collateral (USDC) as safety cushion.
                    </p>

                    <div className="space-y-3 py-3 border-y border-emerald-200 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Simulated Health Factor</span>
                        <span className="font-bold text-sage">
                          {addScenario.simulated_health_factor.toFixed(3)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Fortified Collateral</span>
                        <span className="text-slate-800">${addScenario.simulated_collateral_usd.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Simulated LTV</span>
                        <span className="text-slate-800">{addScenario.simulated_ltv_pct.toFixed(1)}%</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Safety Buffer</span>
                        <span className="text-sage font-bold">+${addScenario.buffer_to_liquidation_usd.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 text-[11px] text-emerald-900 border-t border-emerald-200 flex items-center space-x-1.5 font-sans font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage shrink-0" />
                    <span>Injected stable buffer restores solvency under deep crash.</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Mathematical Model Assumptions */}
      {simulationData?.assumptions && (
        <div className="p-6 rounded-2xl bg-white border border-amber-900/15 space-y-3 paper-card">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-amber-900 font-bold">
            <Info className="w-4 h-4 text-terracotta" />
            <span>Mathematical Model Assumptions</span>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 font-sans">
            {simulationData.assumptions.map((asm, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-terracotta font-mono font-bold">•</span>
                <span>{asm}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
