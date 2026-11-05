import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <footer className="mt-16 border-t border-amber-900/15 bg-[#f7f5ed] py-8 text-xs text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="p-4 rounded-xl bg-white border border-amber-900/20 flex items-start space-x-3 paper-card">
          <ShieldAlert className="w-4 h-4 text-terracotta mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-mono font-bold text-amber-900 uppercase tracking-wider text-[10px]">
              Regulatory & Risk Disclaimer
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              <strong className="text-slate-900">Simulation, not prediction.</strong> Bachega provides read-only mathematical stress-testing and liquidation proximity monitoring for individual retail DeFi borrowers.
              All calculated Health Factors, liquidation boundaries, and scenario recoveries are hypothetical models based on instantaneous price shocks and do not account for DEX slippage, gas fee spikes, or secondary market liquidity freezes.
              This platform possesses no vault-operator permissions, holds zero custody of user funds, and performs no automated on-chain execution or transaction signing.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-2 font-sans">
          <div>
            © {new Date().getFullYear()} Bachega — Individual DeFi Risk & Crash Simulation Workbench.
          </div>
          <div className="flex items-center space-x-3 mt-2 sm:mt-0 font-mono text-[10px]">
            <span>FastAPI v1.0.0</span>
            <span>•</span>
            <span>CoinGecko Live API</span>
            <span>•</span>
            <span>Alchemy Node</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
