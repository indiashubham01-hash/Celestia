import React from 'react';
import { ArrowRight, ShieldCheck, Sliders, CheckCircle2, Sparkles, LogIn } from 'lucide-react';

export default function HeroSection({ onSignIn, onTryDemo }) {
  return (
    <div className="relative overflow-hidden pt-12 pb-20 border-b border-amber-900/10 bg-gradient-to-b from-[#fcfbf7] via-[#f8f5ee] to-[#fcfbf7]">
      {/* Subtle warm ambient tint */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-200/25 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Top Heritage Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/90 border border-amber-900/20 text-xs font-mono text-amber-900 mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta"></span>
            <span className="font-bold">INDIVIDUAL BORROWER WORKBENCH</span>
            <span className="text-amber-900/40">•</span>
            <span className="text-slate-600 font-sans font-medium">ZERO PRIVATE KEYS NEEDED</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-heritage font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Markets Crash.{' '}
            <span className="text-terracotta italic underline decoration-amber-300 decoration-wavy decoration-2">
              You Don't Have To.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-700 mb-8 leading-relaxed font-sans font-normal max-w-2xl mx-auto">
            Deterministic risk modeling and stress testing for retail DeFi borrowers.
            Simulate flash crashes, track liquidation proximity in real-time, and compare de-leveraging options before margin calls trigger.
          </p>

          {/* Action CTAs: Try Live Demo & Sign In */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onTryDemo}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-terracotta hover:bg-terracotta-700 text-white font-bold text-sm tracking-wide transition-all shadow-terracotta flex items-center justify-center space-x-2.5"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Try Live Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onSignIn}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-amber-50/60 text-slate-900 border border-amber-900/25 font-bold text-sm transition-all shadow-sm flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4 text-slate-700" />
              <span>Sign In</span>
            </button>
          </div>
        </div>

        {/* How It Works - 3 Pillars */}
        <div className="mt-4">
          <div className="text-center mb-8">
            <h2 className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold">How It Works</h2>
            <p className="text-xl font-heritage font-bold text-slate-900 mt-1">Stress-Testing Your Positions In 3 Steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="paper-card p-6 rounded-2xl transition-all hover:shadow-paper-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-mono font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-heritage font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sage" />
                <span>Read-Only Tracking</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Paste any public 0x EVM or Solana address. We index your collateral and debt positions across Aave v3, Compound v3, and Spark without touching your private keys.
              </p>
            </div>

            {/* Step 2 */}
            <div className="paper-card p-6 rounded-2xl transition-all hover:shadow-paper-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-mono font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-heritage font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-terracotta" />
                <span>Simulate Price Shocks</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Apply hypothetical -10% to -50% flash crashes to your volatile collateral (ETH, WBTC). Our deterministic NumPy engine calculates your resulting Health Factor immediately.
              </p>
            </div>

            {/* Step 3 */}
            <div className="paper-card p-6 rounded-2xl transition-all hover:shadow-paper-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-mono font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-heritage font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brass" />
                <span>Evaluate 3 Actions</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Compare side-by-side outcomes: <strong className="text-slate-800">Do Nothing</strong> (shortfall risk), <strong className="text-slate-800">Repay Debt</strong> (de-leveraging), or <strong className="text-slate-800">Add Collateral</strong> (buffer injection).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
