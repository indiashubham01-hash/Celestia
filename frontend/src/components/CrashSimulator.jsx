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
      return { label: 'EQUILIBRIUM', color: 'text-[#166534] bg-[#dcfce7] border-[#86efac] font-bold' };
    }
    if (hf >= 1.25) {
      return { label: 'STABLE', color: 'text-[#4c1d95] bg-[#ede9fe] border-[#c4b5fd] font-bold' };
    }
    if (hf >= 1.1) {
      return { label: 'TENSION', color: 'text-[#92400e] bg-[#fef3c7] border-[#fde68a] font-bold' };
    }
    if (hf >= 1.0) {
      return { label: 'CRITICAL', color: 'text-[#991515] bg-[#fee2e2] border-[#fca5a5] font-bold animate-pulse' };
    }
    return { label: 'LIQUIDATED', color: 'text-white bg-[#7f1d1d] border-[#991515] font-black' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Title & Compliance Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-[#e8d4a8] pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-2xl font-heritage font-black text-[#1c1812] tracking-tight">
              DeFi Crash Simulator
            </h2>
            <span className="px-3 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#b45309] text-white border border-[#924309] border-b-2 border-[#78350f] uppercase shadow-sm">
              SIMULATION, NOT PREDICTION
            </span>
          </div>
          <p className="text-xs text-[#443a2b] max-w-2xl font-sans">
            Model the exact mechanics of instantaneous market price shocks. Test what happens to your position if you
            do nothing, de-leverage by repaying debt, or inject a collateral buffer.
          </p>
        </div>

        {/* Position Switcher */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-[#786e5e] whitespace-nowrap font-bold font-mono">Target Position:</label>
          <select
            value={selectedPosId}
            onChange={(e) => setSelectedPosId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#e8d4a8] border-b-2 border-[#d8c292] text-[#1c1812] text-xs font-bold focus:outline-none focus:border-[#4c1d95] shadow-sm"
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
            <span className="text-[11px] text-[#786e5e] uppercase tracking-wider font-mono font-bold">Protocol</span>
            <p className="text-sm font-heritage font-black text-[#1c1812] mt-0.5">{positionDetail.protocol}</p>
            <p className="text-[11px] text-[#786e5e] capitalize">{positionDetail.chain}</p>
          </div>

          <div>
            <span className="text-[11px] text-[#786e5e] uppercase tracking-wider font-mono font-bold">Health Factor</span>
            <p className="text-base font-mono font-black text-[#4c1d95] mt-0.5">
              {positionDetail.health_factor.toFixed(3)}
            </p>
            <span className="text-[11px] text-[#786e5e]">Fulcrum: 1.00</span>
          </div>

          <div>
            <span className="text-[11px] text-[#786e5e] uppercase tracking-wider font-mono font-bold">Liquidation Price</span>
            <p className="text-sm font-mono font-black text-[#b91c1c] mt-0.5">
              ${positionDetail.liquidation_price_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-[#786e5e]">Volatile Asset</span>
          </div>

          <div>
            <span className="text-[11px] text-[#786e5e] uppercase tracking-wider font-mono font-bold">Liquidation Distance</span>
            <p className="text-sm font-mono font-black text-[#b45309] mt-0.5">
              {positionDetail.liquidation_proximity_pct.toFixed(2)}%
            </p>
            <span className="text-[11px] text-[#786e5e]">Drop to trigger</span>
          </div>

          <div>
            <span className="text-[11px] text-[#786e5e] uppercase tracking-wider font-mono font-bold">Total Collateral</span>
            <p className="text-sm font-mono font-bold text-[#1c1812] mt-0.5">
              ${positionDetail.total_collateral_usd.toLocaleString()}
            </p>
            <span className="text-[11px] text-[#786e5e]">
              {positionDetail.collaterals.map(c => `${c.amount} ${c.symbol}`).join(', ')}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#786e5e] uppercase tracking-wider font-mono font-bold">Total Debt</span>
            <p className="text-sm font-mono font-bold text-[#1c1812] mt-0.5">
              ${positionDetail.total_debt_usd.toLocaleString()}
            </p>
            <span className="text-[11px] text-[#786e5e]">
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
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#4c1d95] font-black flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-[#4c1d95]" />
                <span>SIGNATURE CAROUSEL EQUILIBRIUM SCALE</span>
              </span>
              <h3 className="text-base font-heritage font-black text-[#1c1812] mt-0.5">
                Acrobatic Counterweight Under {activeStep.shock_percentage}% Price Shock
              </h3>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-[#786e5e]">Simulated Asset Price:</span>
              <strong className="text-[#1c1812] text-sm">${activeStep.simulated_volatile_asset_price.toLocaleString()}</strong>
            </div>
          </div>

          {/* High-Wire Equilibrium Track */}
          <div className="space-y-1.5 py-2">
            <div className="relative h-6 rounded-full bg-[#f5e8cc] border border-[#e8d4a8] overflow-hidden flex items-center shadow-inner">
              {/* Liquidation Fall Zone */}
              <div className="h-full bg-[#fee2e2] border-r border-[#fca5a5] w-[38%] flex items-center justify-start px-3">
                <span className="text-[10px] font-black text-[#991515] tracking-wider font-mono">LIQUIDATION FALL</span>
              </div>
              {/* Tension Margin */}
              <div className="h-full bg-[#fef3c7] border-r border-[#fde68a] w-[24%] flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#92400e] font-mono">TENSION</span>
              </div>
              {/* Safety Net Zone */}
              <div className="h-full bg-[#dcfce7] w-[38%] flex items-center justify-end px-3">
                <span className="text-[10px] font-black text-[#166534] tracking-wider font-mono">EQUILIBRIUM NET</span>
              </div>

              {/* Wire Walker Marker */}
              {(() => {
                const walkerPos = Math.min(95, Math.max(5, (activeStep.do_nothing.simulated_health_factor / 1.8) * 100));
                return (
                  <div
                    style={{ left: `${walkerPos}%` }}
                    className="absolute -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-300"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#4c1d95] border-2 border-white shadow-md"></div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-between text-[11px] text-[#786e5e] font-mono pt-0.5">
              <span>HF 0.80 (Deficit)</span>
              <span className="text-[#b91c1c] font-black">HF 1.00 (Liquidation Boundary)</span>
              <span className="text-[#15803d] font-black">HF 1.50+ (Stable Net)</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Shock Controller Slider */}
      <div className="paper-card p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#b45309] font-bold">Hypothetical Stress Parameter</span>
            <h3 className="text-lg font-heritage font-black text-[#1c1812]">Collateral Price Shock Level</h3>
          </div>
          <div className="flex items-center space-x-2">
            {[-10, -20, -25, -35, -50].map((preset) => (
              <button
                key={preset}
                onClick={() => setShockPercent(preset)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  shockPercent === preset
                    ? 'btn-3d-royal shadow-sm'
                    : 'bg-[#f5e8cc] text-[#1c1812] border border-[#e8d4a8] border-b-2 border-[#d8c292] hover:bg-white'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-mono text-[#443a2b]">
            <span>Minor Dip (-10%)</span>
            <span className="text-base font-black text-[#4c1d95] font-mono">{shockPercent}% Instant Shock</span>
            <span>Severe Flash Crash (-50%)</span>
          </div>
          <input
            type="range"
            min="-50"
            max="-10"
            step="5"
            value={shockPercent}
            onChange={(e) => setShockPercent(Number(e.target.value))}
            className="w-full h-2.5 bg-[#f5e8cc] rounded-lg appearance-none cursor-pointer accent-[#4c1d95]"
          />
        </div>
      </div>

      {/* Comparative Scenario Results: 3 Actions */}
      {activeStep && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heritage font-black text-[#1c1812]">
              Comparative Scenario Outcomes at {activeStep.shock_percentage}% Market Plunge
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Scenario 1: Do Nothing */}
            <div className={`p-6 rounded-2xl flex flex-col justify-between paper-card ${
              activeStep.do_nothing.is_liquidated
                ? 'border-[#fca5a5] bg-[#fee2e2]/60'
                : 'border-[#e8d4a8] bg-white'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#786e5e]"></span>
                    <h4 className="text-base font-heritage font-black text-[#1c1812]">1. Do Nothing</h4>
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

                <p className="text-xs text-[#443a2b] mb-6 font-sans">
                  Take no corrective action. Observe position under unmitigated crash.
                </p>

                <div className="space-y-3 py-3 border-y border-[#e8d4a8] text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#786e5e] font-sans">Simulated Health Factor</span>
                    <span className={`font-bold ${activeStep.do_nothing.is_liquidated ? 'text-[#b91c1c]' : 'text-[#1c1812]'}`}>
                      {activeStep.do_nothing.simulated_health_factor.toFixed(3)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#786e5e] font-sans">Simulated LTV</span>
                    <span className="text-[#1c1812]">{activeStep.do_nothing.simulated_ltv_pct.toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#786e5e] font-sans">Collateral Value</span>
                    <span className="text-[#1c1812]">${activeStep.do_nothing.simulated_collateral_usd.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#786e5e] font-sans">Liquidation Status</span>
                    <span className={`font-bold ${activeStep.do_nothing.is_liquidated ? 'text-[#b91c1c]' : 'text-[#15803d]'}`}>
                      {activeStep.do_nothing.is_liquidated ? 'LIQUIDATED' : 'SAFE'}
                    </span>
                  </div>

                  {activeStep.do_nothing.is_liquidated && (
                    <div className="flex justify-between text-[#b91c1c] pt-1">
                      <span className="font-sans font-bold">Liquidation Shortfall</span>
                      <span className="font-bold">${activeStep.do_nothing.liquidation_shortfall_usd.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 text-[11px] text-[#786e5e] border-t border-[#e8d4a8] font-sans">
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
                <div className="p-6 rounded-2xl border border-[#c4b5fd] bg-[#f5f3ff] flex flex-col justify-between paper-card">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#4c1d95]"></span>
                        <h4 className="text-base font-heritage font-black text-[#1c1812]">2. Repay Debt</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs text-[#443a2b] mb-6 font-sans">
                      De-leverage by repaying $10,000 in outstanding debt before crash hits.
                    </p>

                    <div className="space-y-3 py-3 border-y border-[#ddd6fe] text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#786e5e] font-sans">Simulated Health Factor</span>
                        <span className="font-bold text-[#4c1d95]">
                          {repayScenario.simulated_health_factor.toFixed(3)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#786e5e] font-sans">Remaining Debt</span>
                        <span className="text-[#1c1812]">${repayScenario.simulated_debt_usd.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#786e5e] font-sans">Simulated LTV</span>
                        <span className="text-[#1c1812]">{repayScenario.simulated_ltv_pct.toFixed(1)}%</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#786e5e] font-sans">Liquidation Buffer</span>
                        <span className="text-[#15803d] font-bold">+${repayScenario.buffer_to_liquidation_usd.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 text-[11px] text-[#4c1d95] border-t border-[#ddd6fe] flex items-center space-x-1.5 font-sans font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4c1d95] shrink-0" />
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
                <div className="p-6 rounded-2xl border border-[#86efac] bg-[#f0fdf4] flex flex-col justify-between paper-card">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]"></span>
                        <h4 className="text-base font-heritage font-black text-[#1c1812]">3. Add Collateral</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs text-[#443a2b] mb-6 font-sans">
                      Deposit +$10,000 in unencumbered stable collateral (USDC) as safety cushion.
                    </p>

                    <div className="space-y-3 py-3 border-y border-[#bbf7d0] text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#786e5e] font-sans">Simulated Health Factor</span>
                        <span className="font-bold text-[#15803d]">
                          {addScenario.simulated_health_factor.toFixed(3)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#786e5e] font-sans">Fortified Collateral</span>
                        <span className="text-[#1c1812]">${addScenario.simulated_collateral_usd.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#786e5e] font-sans">Simulated LTV</span>
                        <span className="text-[#1c1812]">{addScenario.simulated_ltv_pct.toFixed(1)}%</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#786e5e] font-sans">Safety Buffer</span>
                        <span className="text-[#15803d] font-bold">+${addScenario.buffer_to_liquidation_usd.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 text-[11px] text-[#166534] border-t border-[#bbf7d0] flex items-center space-x-1.5 font-sans font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
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
        <div className="p-6 rounded-2xl bg-white border border-[#e8d4a8] space-y-3 paper-card">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#4c1d95] font-black">
            <Info className="w-4 h-4 text-[#4c1d95]" />
            <span>Mathematical Model Assumptions</span>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#443a2b] font-sans">
            {simulationData.assumptions.map((asm, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-[#4c1d95] font-mono font-bold">•</span>
                <span>{asm}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}