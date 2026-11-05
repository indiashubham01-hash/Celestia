import React from 'react';
import { ArrowRight, ShieldCheck, Sliders, CheckCircle2, Sparkles, LogIn } from 'lucide-react';

export default function HeroSection({ onSignIn, onTryDemo }) {
  return (
    <div className="relative overflow-hidden pt-12 pb-20 border-b-2 border-[#e8d4a8] bg-[#fdf5e6]">
      {/* Subtle warm ambient carnival glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#fde68a]/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-[#ddd6fe]/25 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Grid: Left copy & CTAs, Right 3D Ticket Stubs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 text-left">
            {/* Top Carnival Stamp Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-lg bg-[#4c1d95] text-white border border-[#3b1575] shadow-[0_3px_0_#280c54] text-xs font-mono font-bold mb-6">
              <span className="w-2 h-2 rounded-full bg-[#fde68a] animate-ping"></span>
              <span className="tracking-wider uppercase">DEFI RISK WORKBENCH • AAVE V3</span>
              <span className="text-[#ddd6fe] opacity-50">•</span>
              <span className="text-[#fef3c7] font-sans font-medium text-[11px]">ZERO PRIVATE KEYS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-heritage font-black tracking-tight text-[#1c1812] mb-6 leading-[1.12]">
              Markets Crash.{' '}
              <span className="text-[#b91c1c] italic block sm:inline underline decoration-[#b45309] decoration-wavy decoration-2">
                You Don't Have To.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-[#443a2b] mb-8 leading-relaxed font-sans max-w-xl">
              Deterministic stress testing and liquidation proximity modeling for retail DeFi borrowers.
              Simulate flash crashes, stress-test your volatile collateral, and compare recovery actions before liquidation penalties hit.
            </p>

            {/* Action CTAs: Try Live Demo & Sign In */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onTryDemo}
                className="btn-3d-royal px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2.5"
              >
                <Sparkles className="w-4 h-4 text-[#fde68a]" />
                <span>Try Live Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onSignIn}
                className="btn-3d-gold px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span>Sign In / OTP</span>
              </button>
            </div>

            <p className="mt-4 text-xs font-mono text-[#786e5e]">
              ⚡ No wallet connection required. Instant access via mock session.
            </p>
          </div>

          {/* Right Column: 3D Carnival Scenario Ticket Stubs (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-[#f5e8cc] border border-[#e8d4a8] shadow-[0_4px_0_#d8c292] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#e8d4a8] pb-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#b45309] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Instant Stress Matrix
                </span>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#e8d4a8] font-bold text-[#4c1d95]">
                  ETH-USD Base: $2,400
                </span>
              </div>

              {/* Scenario 1: Mild */}
              <div className="paper-card p-4 rounded-xl relative overflow-hidden transition-transform hover:-translate-y-0.5">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#4c1d95]" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4c1d95]">
                      MILD SHOCK
                    </span>
                    <div className="text-2xl font-heritage font-black text-[#1c1812]">−10%</div>
                    <div className="text-[11px] text-[#786e5e]">ETH drops to $2,160</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-[#786e5e] uppercase">Resulting HF</div>
                    <div className="text-xl font-mono font-black text-[#15803d]">1.84</div>
                    <span className="inline-block px-2 py-0.5 text-[9px] font-mono font-bold bg-[#dcfce7] text-[#166534] rounded border border-[#86efac]">
                      EQUILIBRIUM
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario 2: Moderate */}
              <div className="paper-card p-4 rounded-xl relative overflow-hidden transition-transform hover:-translate-y-0.5">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#b45309]" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#b45309]">
                      MODERATE CRASH
                    </span>
                    <div className="text-2xl font-heritage font-black text-[#1c1812]">−30%</div>
                    <div className="text-[11px] text-[#786e5e]">ETH drops to $1,680</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-[#786e5e] uppercase">Resulting HF</div>
                    <div className="text-xl font-mono font-black text-[#b45309]">1.19</div>
                    <span className="inline-block px-2 py-0.5 text-[9px] font-mono font-bold bg-[#fef3c7] text-[#92400e] rounded border border-[#fde68a]">
                      TENSION
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario 3: Severe */}
              <div className="paper-card p-4 rounded-xl relative overflow-hidden transition-transform hover:-translate-y-0.5">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#b91c1c]" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#b91c1c]">
                      SEVERE FLASH CRASH
                    </span>
                    <div className="text-2xl font-heritage font-black text-[#b91c1c]">−50%</div>
                    <div className="text-[11px] text-[#786e5e]">ETH drops to $1,200</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-[#786e5e] uppercase">Resulting HF</div>
                    <div className="text-xl font-mono font-black text-[#b91c1c]">0.72 ⚠</div>
                    <span className="inline-block px-2 py-0.5 text-[9px] font-mono font-bold bg-[#fee2e2] text-[#991515] rounded border border-[#fca5a5]">
                      LIQUIDATABLE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works - 3 Step Pillars */}
        <div className="mt-8 pt-8 border-t-2 border-[#e8d4a8]">
          <div className="text-center mb-8">
            <span className="ticket-badge px-3 py-1 rounded text-xs font-mono uppercase font-bold tracking-widest">
              HOW IT WORKS
            </span>
            <p className="text-2xl font-heritage font-black text-[#1c1812] mt-2">
              Stress-Testing Your Positions In 3 Steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="paper-card p-6 rounded-2xl transition-all hover:shadow-paper-lg">
              <div className="w-10 h-10 rounded-xl bg-[#4c1d95] text-white flex items-center justify-center font-mono font-black text-sm mb-4 border border-[#3b1575] shadow-[0_3px_0_#280c54]">
                01
              </div>
              <h3 className="text-base font-heritage font-bold text-[#1c1812] mb-2 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#15803d]" />
                <span>Read-Only Tracking</span>
              </h3>
              <p className="text-sm text-[#443a2b] leading-relaxed font-sans">
                Paste any public 0x EVM or Solana address. We index your collateral and debt positions across Aave v3, Compound v3, and Spark without touching your private keys.
              </p>
            </div>

            {/* Step 2 */}
            <div className="paper-card p-6 rounded-2xl transition-all hover:shadow-paper-lg">
              <div className="w-10 h-10 rounded-xl bg-[#b45309] text-white flex items-center justify-center font-mono font-black text-sm mb-4 border border-[#924309] shadow-[0_3px_0_#78350f]">
                02
              </div>
              <h3 className="text-base font-heritage font-bold text-[#1c1812] mb-2 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#b45309]" />
                <span>Simulate Price Shocks</span>
              </h3>
              <p className="text-sm text-[#443a2b] leading-relaxed font-sans">
                Apply hypothetical -10% to -50% flash crashes to your volatile collateral (ETH, WBTC). Our deterministic NumPy engine calculates your resulting Health Factor immediately.
              </p>
            </div>

            {/* Step 3 */}
            <div className="paper-card p-6 rounded-2xl transition-all hover:shadow-paper-lg">
              <div className="w-10 h-10 rounded-xl bg-[#b91c1c] text-white flex items-center justify-center font-mono font-black text-sm mb-4 border border-[#991515] shadow-[0_3px_0_#7f1d1d]">
                03
              </div>
              <h3 className="text-base font-heritage font-bold text-[#1c1812] mb-2 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#b91c1c]" />
                <span>Evaluate 3 Actions</span>
              </h3>
              <p className="text-sm text-[#443a2b] leading-relaxed font-sans">
                Compare side-by-side outcomes: <strong className="text-[#1c1812]">Do Nothing</strong> (shortfall risk), <strong className="text-[#1c1812]">Repay Debt</strong> (de-leveraging), or <strong className="text-[#1c1812]">Add Collateral</strong> (buffer injection).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}