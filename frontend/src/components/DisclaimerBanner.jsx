import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <footer className="mt-16 border-t-2 border-black bg-[#fef08a] py-8 text-xs text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="p-4 rounded-xl bg-white border-2 border-black shadow-[4px_4px_0_#000] flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-black mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-mono font-black text-black uppercase tracking-wider text-[11px] bg-[#fef08a] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
              Regulatory &amp; Risk Disclaimer
            </span>
            <p className="text-[11px] text-black/80 leading-relaxed font-sans font-medium pt-1">
              <strong className="text-black font-black">Simulation, not prediction.</strong> Bachega provides read-only mathematical stress-testing and liquidation proximity monitoring for individual retail DeFi borrowers.
              All calculated Health Factors, liquidation boundaries, and scenario recoveries are hypothetical models based on instantaneous price shocks and do not account for DEX slippage, gas fee spikes, or secondary market liquidity freezes.
              This platform possesses no vault-operator permissions, holds zero custody of user funds, and performs no automated on-chain execution or transaction signing.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-black/80 pt-2 font-sans font-bold">
          <div>
            © {new Date().getFullYear()} Bachega.fi — Individual DeFi Risk &amp; Crash Simulation Workbench.
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