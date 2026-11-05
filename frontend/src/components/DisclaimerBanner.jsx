import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <footer className="mt-16 border-t-2 border-[#e8d4a8] bg-[#f5e8cc] py-8 text-xs text-[#443a2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="p-4 rounded-xl bg-white border border-[#e8d4a8] border-b-3 border-[#d8c292] flex items-start space-x-3 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-[#4c1d95] mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-mono font-bold text-[#b45309] uppercase tracking-wider text-[10px]">
              Regulatory &amp; Risk Disclaimer
            </span>
            <p className="text-[11px] text-[#443a2b] leading-relaxed font-sans">
              <strong className="text-[#1c1812]">Simulation, not prediction.</strong> Bachega provides read-only mathematical stress-testing and liquidation proximity monitoring for individual retail DeFi borrowers.
              All calculated Health Factors, liquidation boundaries, and scenario recoveries are hypothetical models based on instantaneous price shocks and do not account for DEX slippage, gas fee spikes, or secondary market liquidity freezes.
              This platform possesses no vault-operator permissions, holds zero custody of user funds, and performs no automated on-chain execution or transaction signing.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#786e5e] pt-2 font-sans">
          <div>
            © {new Date().getFullYear()} Bachega — Individual DeFi Risk &amp; Crash Simulation Workbench.
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