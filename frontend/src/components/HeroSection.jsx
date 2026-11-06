import React from 'react';
import { ArrowRight, ShieldCheck, Sliders, CheckCircle2, Sparkles, LogIn } from 'lucide-react';

export default function HeroSection({ onSignIn, onTryDemo }) {
  return (
    <div className="relative overflow-hidden pt-12 pb-20 border-b-2 border-black bg-[#fffdf5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Grid: Left copy & CTAs, Right Neo-Brutalist Scenario Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 text-left">
            {/* Top Neo Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-[#fef08a] text-black border-2 border-black shadow-[3px_3px_0_#000000] text-xs font-mono font-black mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] border border-black animate-ping"></span>
              <span className="tracking-wider uppercase">DEFI RISK WORKBENCH • AAVE V3</span>
              <span className="opacity-50">•</span>
              <span className="font-bold">ZERO PRIVATE KEYS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black mb-6 leading-[1.1]">
              Markets Crash.{' '}
              <span className="bg-[#fef08a] px-2 py-0.5 border-2 border-black shadow-[4px_4px_0_#000000] inline-block mt-2 sm:mt-0">
                You Don't Have To.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-gray-800 mb-8 leading-relaxed font-sans max-w-xl font-medium">
              Deterministic stress testing and liquidation proximity modeling for retail DeFi borrowers.
              Simulate flash crashes, stress-test your volatile collateral, and evaluate 5 comprehensive defense strategies before liquidation penalties hit.
            </p>

            {/* Action CTAs: Try Live Demo & Sign In */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onTryDemo}
                className="btn-3d-royal px-8 py-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center space-x-2.5"
              >
                <Sparkles className="w-4 h-4 text-[#fef08a]" />
                <span>Try Live Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onSignIn}
                className="btn-3d-gold px-8 py-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4 text-black" />
                <span>Sign In / OTP</span>
              </button>
            </div>

            <p className="mt-4 text-xs font-mono text-gray-600 font-bold">
              ⚡ No wallet connection required. Instant access via mock session.
            </p>
          </div>

          {/* Right Column: Neo-Brutalist Scenario Matrix Box (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border-2 border-black shadow-[6px_6px_0_#000000] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#3b82f6]" /> Instant Stress Matrix
                </span>
                <span className="text-xs font-mono bg-[#fef08a] px-2.5 py-1 rounded-md border-2 border-black font-black text-black shadow-[2px_2px_0_#000000]">
                  ETH Base: $3,000
                </span>
              </div>

              {/* Scenario 1: Mild */}
              <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[3px_3px_0_#000000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#3b82f6]">
                      MILD SHOCK
                    </span>
                    <div className="text-2xl font-black text-black">−15%</div>
                    <div className="text-xs text-gray-600 font-mono">ETH drops to $2,550</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-gray-500 uppercase font-bold">Resulting HF</div>
                    <div className="text-xl font-mono font-black text-[#15803d]">1.17</div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-black bg-[#86efac] text-[#065f46] rounded border border-black shadow-[1px_1px_0_#000000]">
                      SOLVENT
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario 2: Moderate */}
              <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[3px_3px_0_#000000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#854d0e]">
                      MODERATE CRASH
                    </span>
                    <div className="text-2xl font-black text-black">−35%</div>
                    <div className="text-xs text-gray-600 font-mono">ETH drops to $1,950</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-gray-500 uppercase font-bold">Resulting HF</div>
                    <div className="text-xl font-mono font-black text-[#b91c1c]">0.89</div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-black bg-[#fca5a5] text-[#991b1b] rounded border border-black shadow-[1px_1px_0_#000000]">
                      LIQUIDATED
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario 3: Severe */}
              <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[3px_3px_0_#000000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#b91c1c]">
                      SEVERE FLASH CRASH
                    </span>
                    <div className="text-2xl font-black text-black">−50%</div>
                    <div className="text-xs text-gray-600 font-mono">ETH drops to $1,500</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-gray-500 uppercase font-bold">Resulting HF</div>
                    <div className="text-xl font-mono font-black text-[#b91c1c]">0.52 ⚠️</div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-black bg-[#f87171] text-white rounded border border-black shadow-[1px_1px_0_#000000]">
                      DEFICIT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works - 3 Step Pillars */}
        <div className="mt-8 pt-10 border-t-2 border-black">
          <div className="text-center mb-8">
            <span className="px-3.5 py-1.5 rounded-md bg-[#fef08a] border-2 border-black shadow-[2px_2px_0_#000000] text-xs font-mono uppercase font-black tracking-widest text-black">
              HOW IT WORKS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-black mt-3">
              Stress-Testing Your Positions In 3 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_#000000] transition-all hover:shadow-[6px_6px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-[#3b82f6] text-white flex items-center justify-center font-mono font-black text-sm mb-4 border-2 border-black shadow-[2px_2px_0_#000000]">
                01
              </div>
              <h3 className="text-base font-black text-black mb-2 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                <span>Read-Only Tracking</span>
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed font-sans font-medium">
                Paste any public 0x EVM or Solana address. We index your collateral and debt positions across Aave v3, Compound v3, and Spark without touching your private keys.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_#000000] transition-all hover:shadow-[6px_6px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-[#fef08a] text-black flex items-center justify-center font-mono font-black text-sm mb-4 border-2 border-black shadow-[2px_2px_0_#000000]">
                02
              </div>
              <h3 className="text-base font-black text-black mb-2 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-black" />
                <span>Simulate Price Shocks</span>
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed font-sans font-medium">
                Apply hypothetical -10% to -50% flash crashes to your volatile collateral (ETH, WBTC). Our deterministic NumPy engine calculates your resulting Health Factor immediately.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_#000000] transition-all hover:shadow-[6px_6px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-[#f87171] text-black flex items-center justify-center font-mono font-black text-sm mb-4 border-2 border-black shadow-[2px_2px_0_#000000]">
                03
              </div>
              <h3 className="text-base font-black text-black mb-2 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>5 Defense Strategies</span>
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed font-sans font-medium">
                Compare side-by-side outcomes: <strong className="text-black">Do Nothing</strong>, <strong className="text-black">Repay Debt</strong>, <strong className="text-black">Add Collateral</strong>, <strong className="text-black">Collateral Swap</strong>, or <strong className="text-black">Partial Deleverage</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
