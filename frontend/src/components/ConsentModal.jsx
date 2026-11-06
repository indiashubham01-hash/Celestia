import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  FileText,
  Lock,
  ExternalLink,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ConsentModal({
  isOpen,
  onClose,
  onAccept,
  currentUser,
}) {
  const [hasAccepted, setHasAccepted] = useState(() => {
    return localStorage.getItem('bachega_consent_accepted') === 'true';
  });

  const [acceptedTimestamp, setAcceptedTimestamp] = useState(() => {
    return localStorage.getItem('bachega_consent_timestamp') || '';
  });

  // 3 Checkbox requirements for explicit consent
  const [checkSimulator, setCheckSimulator] = useState(hasAccepted);
  const [checkNoLiability, setCheckNoLiability] = useState(hasAccepted);
  const [checkSoleResponsibility, setCheckSoleResponsibility] = useState(hasAccepted);

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'full'

  useEffect(() => {
    const isAcc = localStorage.getItem('bachega_consent_accepted') === 'true';
    setHasAccepted(isAcc);
    if (isAcc) {
      setCheckSimulator(true);
      setCheckNoLiability(true);
      setCheckSoleResponsibility(true);
      setAcceptedTimestamp(localStorage.getItem('bachega_consent_timestamp') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allChecked = checkSimulator && checkNoLiability && checkSoleResponsibility;

  const handleAcceptAll = () => {
    const nowIso = new Date().toISOString();
    localStorage.setItem('bachega_consent_accepted', 'true');
    localStorage.setItem('bachega_consent_timestamp', nowIso);
    localStorage.setItem('bachega_consent_version', '1.0');

    setHasAccepted(true);
    setAcceptedTimestamp(nowIso);
    setCheckSimulator(true);
    setCheckNoLiability(true);
    setCheckSoleResponsibility(true);

    // Sync consent to Supabase user metadata if logged in
    try {
      supabase.auth.updateUser({
        data: {
          terms_consent: true,
          terms_consent_timestamp: nowIso,
          terms_version: '1.0',
        },
      }).catch(() => {});
    } catch (e) {}

    if (onAccept) {
      onAccept({
        accepted: true,
        timestamp: nowIso,
        version: '1.0',
      });
    }

    onClose();
  };

  const handleRevoke = () => {
    localStorage.removeItem('bachega_consent_accepted');
    localStorage.removeItem('bachega_consent_timestamp');
    setHasAccepted(false);
    setAcceptedTimestamp('');
    setCheckSimulator(false);
    setCheckNoLiability(false);
    setCheckSoleResponsibility(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border-2 border-black shadow-[8px_8px_0_#000] rounded-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Solid Accent Ribbon */}
        <div className="h-2 bg-black w-full" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b-2 border-black bg-[#fef08a] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#dc2626] text-white flex items-center justify-center font-black border-2 border-black shadow-[2px_2px_0_#000]">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-black tracking-tight">
                  Terms of Service &amp; Risk Consent
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-mono font-black uppercase bg-white border border-black rounded shadow-[1px_1px_0_#000]">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-black/80 font-mono font-semibold">
                Limitation of Liability • Non-Custodial Simulation Agreement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-black hover:bg-black/10 p-1.5 rounded-lg transition-colors border border-black/30"
            title="Close"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="px-6 pt-3 pb-1 bg-[#fffbeb] border-b-2 border-black/10 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-black border-2 border-black transition-all ${
                activeTab === 'summary'
                  ? 'bg-white shadow-[2px_2px_0_#000]'
                  : 'bg-transparent border-transparent text-black/60 hover:text-black'
              }`}
            >
              Summary Key Terms
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('full')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-black border-2 border-black transition-all ${
                activeTab === 'full'
                  ? 'bg-white shadow-[2px_2px_0_#000]'
                  : 'bg-transparent border-transparent text-black/60 hover:text-black'
              }`}
            >
              Full Legal Agreement
            </button>
          </div>

          {hasAccepted && (
            <span className="text-[10px] font-mono font-black text-[#15803d] bg-[#dcfce7] border border-[#16a34a] px-2 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
              Accepted on {acceptedTimestamp ? new Date(acceptedTimestamp).toLocaleDateString() : 'Active'}
            </span>
          )}
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 font-sans text-xs text-black/90 leading-relaxed">
          {activeTab === 'summary' ? (
            <>
              {/* Alert Callout */}
              <div className="p-4 rounded-xl bg-[#fee2e2] border-2 border-black shadow-[3px_3px_0_#000] flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-mono font-black uppercase text-[11px] text-[#991b1b]">
                    Critical Notice: We Are Not Responsible for Any Financial Losses
                  </h4>
                  <p className="text-[11px] text-black/85 leading-snug">
                    Bachega.fi is an open, educational risk workbench. We <strong>do not custody funds</strong>, <strong>do not provide financial advice</strong>, and <strong>are NOT responsible or liable</strong> for any liquidations, debt penalties, gas fees, or market volatility you experience on Aave, Compound, Spark, or any other protocol.
                  </p>
                </div>
              </div>

              {/* 4 Pillars Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Simulation Only */}
                <div className="p-3.5 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0_#000] space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-black bg-[#fef08a] px-1.5 py-0.5 text-[10px] border border-black rounded">
                      CLAUSE 1
                    </span>
                    <strong className="text-black font-black text-xs">Simulation, Not Prediction</strong>
                  </div>
                  <p className="text-[11px] text-black/75">
                    All Health Factors, liquidation price boundaries ($P_{`liq`}$), and flash crash models (-10% to -50%) are hypothetical mathematical projections. Real market conditions involve DEX slippage, gas spikes, and liquidity freezes not modeled here.
                  </p>
                </div>

                {/* 2. Zero Custody */}
                <div className="p-3.5 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0_#000] space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-black bg-[#bae6fd] px-1.5 py-0.5 text-[10px] border border-black rounded">
                      CLAUSE 2
                    </span>
                    <strong className="text-black font-black text-xs">100% Non-Custodial</strong>
                  </div>
                  <p className="text-[11px] text-black/75">
                    We never request, store, or have access to your private keys or seed phrases. Bachega contains no automated bot execution and cannot sign or broadcast transactions on your behalf.
                  </p>
                </div>

                {/* 3. Total Liability Limitation */}
                <div className="p-3.5 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0_#000] space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-black bg-[#fca5a5] px-1.5 py-0.5 text-[10px] border border-black rounded">
                      CLAUSE 3
                    </span>
                    <strong className="text-black font-black text-xs">Zero Liability Waiver</strong>
                  </div>
                  <p className="text-[11px] text-black/75">
                    You unconditionally agree that Bachega and its developers bear zero liability for missed alerts, Telegram delays, RPC errors, contract exploits, or any liquidation losses resulting from your decisions.
                  </p>
                </div>

                {/* 4. Sole User Responsibility */}
                <div className="p-3.5 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0_#000] space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-black bg-[#bbf7d0] px-1.5 py-0.5 text-[10px] border border-black rounded">
                      CLAUSE 4
                    </span>
                    <strong className="text-black font-black text-xs">Sole Borrower Responsibility</strong>
                  </div>
                  <p className="text-[11px] text-black/75">
                    You maintain complete, unshared responsibility for monitoring your vaults on official frontends, calculating tax consequences, and executing de-leveraging transactions at your own discretion.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Full Legal Terms Text */
            <div className="p-4 rounded-xl bg-[#f8fafc] border-2 border-black/20 font-mono text-[11px] space-y-3 leading-relaxed max-h-[300px] overflow-y-auto">
              <h5 className="font-bold text-black uppercase">1. NATURE OF SERVICE</h5>
              <p>
                Bachega.fi ("the Software") is an open-source, read-only analytical interface designed solely to perform deterministic mathematical calculations on public blockchain data and third-party price feeds. The Software does not constitute a broker, custodian, financial intermediary, money transmitter, or fiduciary of any kind.
              </p>

              <h5 className="font-bold text-black uppercase">2. NO FINANCIAL, INVESTMENT, OR TAX ADVICE</h5>
              <p>
                All data, Health Factors, collateral ratios, simulated price drop buffers, and risk defense options presented by the Software or via the companion Telegram bot (@Bachegafi_bot) are strictly educational and informational. None of the content constitutes an offer to buy or sell assets, nor does it represent individualized financial, tax, investment, or legal advice. Always conduct independent research (DYOR).
              </p>

              <h5 className="font-bold text-black uppercase">3. DISCLAIMER OF ALL WARRANTIES ("AS IS")</h5>
              <p>
                THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS, COPYRIGHT HOLDERS, OR HOSTING PROVIDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE.
              </p>

              <h5 className="font-bold text-black uppercase">4. COMPLETE WAIVER OF LIABILITY &amp; INDEMNIFICATION</h5>
              <p>
                UNDER NO CIRCUMSTANCES SHALL BACHEGA.FI, ITS OPERATORS, CONTRIBUTORS, OR AFFILIATES BE RESPONSIBLE OR LIABLE FOR:
                <br />(a) Forced liquidation of collateral on Aave v3, Compound v3, Spark Protocol, MakerDAO, or any other smart contract platform;
                <br />(b) Loss of capital, profits, tokens, or liquidation penalty fees assessed by third-party liquidators;
                <br />(c) Inaccurate, stale, or delayed price data from CoinGecko, Alchemy, RPC nodes, or oracle providers;
                <br />(d) Telegram Bot API downtime, undelivered push notifications, or network latency;
                <br />(e) Smart contract vulnerabilities, hacks, re-entrancy attacks, or de-pegging of stablecoin assets.
              </p>

              <h5 className="font-bold text-black uppercase">5. VOLUNTARY ASSUMPTION OF RISK</h5>
              <p>
                You explicitly acknowledge that borrowing cryptocurrency and maintaining collateralized debt positions in decentralized finance carries extreme volatility and existential loss risks. You voluntarily assume all associated hazards.
              </p>
            </div>
          )}

          {/* Interactive Explicit Checkboxes */}
          <div className="pt-2 border-t-2 border-black/10 space-y-2.5">
            <span className="block font-mono font-black uppercase text-[10px] text-black/70">
              Mandatory User Acknowledgments (Check all to proceed):
            </span>

            <label className="flex items-start space-x-2.5 cursor-pointer select-none p-2 rounded-lg hover:bg-black/5 transition-colors border border-black/20">
              <input
                type="checkbox"
                checked={checkSimulator}
                onChange={(e) => setCheckSimulator(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-2 border-black text-[#dc2626] focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] font-sans font-medium text-black">
                <strong>Simulation, Not Prediction:</strong> I understand that Bachega provides hypothetical mathematical models, not financial or investment advice.
              </span>
            </label>

            <label className="flex items-start space-x-2.5 cursor-pointer select-none p-2 rounded-lg hover:bg-black/5 transition-colors border border-black/20">
              <input
                type="checkbox"
                checked={checkNoLiability}
                onChange={(e) => setCheckNoLiability(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-2 border-black text-[#dc2626] focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] font-sans font-medium text-black">
                <strong>Limitation of Liability:</strong> I explicitly agree that Bachega and its authors are <strong>NOT RESPONSIBLE</strong> for any collateral liquidations, fund losses, gas fees, or delayed alert notifications.
              </span>
            </label>

            <label className="flex items-start space-x-2.5 cursor-pointer select-none p-2 rounded-lg hover:bg-black/5 transition-colors border border-black/20">
              <input
                type="checkbox"
                checked={checkSoleResponsibility}
                onChange={(e) => setCheckSoleResponsibility(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-2 border-black text-[#dc2626] focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] font-sans font-medium text-black">
                <strong>Sole Responsibility:</strong> I acknowledge that this tool is 100% non-custodial and I am solely responsible for managing my debt and executing any safety measures on official protocol frontends.
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="p-4 sm:p-5 border-t-2 border-black bg-[#fef08a] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 order-2 sm:order-1">
            {hasAccepted && (
              <button
                type="button"
                onClick={handleRevoke}
                className="text-[11px] font-mono font-bold text-[#b91c1c] hover:underline"
              >
                Reset / Revoke Consent
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-mono font-black text-black bg-white hover:bg-black/5 border-2 border-black shadow-[2px_2px_0_#000] rounded-xl active:translate-x-0.5 active:translate-y-0.5"
            >
              Close Window
            </button>
          </div>

          <button
            type="button"
            onClick={handleAcceptAll}
            disabled={!allChecked}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-mono font-black text-xs flex items-center justify-center space-x-2 order-1 sm:order-2 transition-all ${
              allChecked
                ? 'btn-3d-royal cursor-pointer'
                : 'bg-gray-300 text-gray-500 border-2 border-black cursor-not-allowed opacity-60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {hasAccepted
                ? 'Consent Verified (Accept & Update)'
                : 'I Understand & Accept All Terms'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
